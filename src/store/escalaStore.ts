import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { NOMES_PADRAO_COMPLETOS, resolverNomePessoa } from '../cobertura.js';
import { formatarDataBR, somarDias } from '../escala.js';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase';
import type {
  EquipeConfigDoc,
  Excecao,
  FuncionarioId,
  HistoricoItem,
  ModoCobertura,
  NomesEquipe,
  NovoEstadoTroca,
  PessoaId,
  TipoExcecao,
} from '../types';

const CONFIG_PATH = 'config/equipe';
const EXCECOES_PATH = 'excecoes';
const HISTORICO_PATH = 'historico';

function gerarIdDocumento(prefixo: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefixo}-${Date.now()}-${rand}`;
}

export async function inicializarDadosIniciaisFirestore(): Promise<void> {
  await testConnection();
  const equipeRef = doc(db, 'config', 'equipe');
  const agora = new Date().toISOString();

  const seedExcecoesBase: Array<Omit<Excecao, 'id'> & { id: string }> = [
    {
      id: 'seed-ferias-lucas-2026',
      tipo: 'ferias',
      funcionarioId: 'vendedor2',
      dataInicio: '2026-12-01',
      dataFim: '2026-12-30',
      novoEstado: '',
      quemCobre: 'gerente1',
      motivo: 'Férias programadas (volta em 02/01)',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'seed-troca-lucas-20261231',
      tipo: 'troca_folga',
      funcionarioId: 'vendedor2',
      dataInicio: '2026-12-31',
      dataFim: '2026-12-31',
      novoEstado: 'folga',
      quemCobre: '',
      motivo: 'gerente cobre',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'seed-ferias-thiago-2027',
      tipo: 'ferias',
      funcionarioId: 'vendedor1',
      dataInicio: '2027-01-04',
      dataFim: '2027-02-02',
      novoEstado: '',
      quemCobre: 'gerente1',
      motivo: 'Férias programadas (volta em 03/02)',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'seed-loja-fechada-20270101',
      tipo: 'loja_fechada',
      funcionarioId: '',
      dataInicio: '2027-01-01',
      dataFim: '2027-01-01',
      novoEstado: '',
      quemCobre: '',
      motivo: 'Feriado — Loja fechada',
      criadoEm: agora,
      atualizadoEm: agora,
    },
  ];

  const seedCoberturas: Array<Omit<Excecao, 'id'> & { id: string }> = [
    {
      id: 'seed-cobertura-lucas-ferias',
      tipo: 'cobertura',
      funcionarioId: '',
      coberturaPorId: 'gerente1',
      cobreFuncionarioId: 'vendedor2',
      dataInicio: '2026-12-01',
      dataFim: '2026-12-30',
      novoEstado: '',
      quemCobre: '',
      modo: 'turno_completo',
      horaInicio: '',
      horaFim: '',
      origemFeriasId: 'seed-ferias-lucas-2026',
      motivo: 'Cobertura de férias',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'seed-cobertura-lucas-3112',
      tipo: 'cobertura',
      funcionarioId: '',
      coberturaPorId: 'gerente1',
      cobreFuncionarioId: 'vendedor2',
      dataInicio: '2026-12-31',
      dataFim: '2026-12-31',
      novoEstado: '',
      quemCobre: '',
      modo: 'turno_completo',
      horaInicio: '',
      horaFim: '',
      origemFeriasId: '',
      motivo: 'gerente cobre',
      criadoEm: agora,
      atualizadoEm: agora,
    },
    {
      id: 'seed-cobertura-thiago-ferias',
      tipo: 'cobertura',
      funcionarioId: '',
      coberturaPorId: 'gerente1',
      cobreFuncionarioId: 'vendedor1',
      dataInicio: '2027-01-04',
      dataFim: '2027-02-02',
      novoEstado: '',
      quemCobre: '',
      modo: 'turno_completo',
      horaInicio: '',
      horaFim: '',
      origemFeriasId: 'seed-ferias-thiago-2027',
      motivo: 'Cobertura de férias',
      criadoEm: agora,
      atualizadoEm: agora,
    },
  ];

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(equipeRef);
      const existente = snap.exists() ? (snap.data() as Partial<EquipeConfigDoc>) : null;
      const precisaSecao7 = !existente || !existente.secao7Inicializada;
      const precisaCobertura = !existente || !existente.coberturaInicializada || !existente.gerente1;

      if (!precisaSecao7 && !precisaCobertura) {
        return;
      }

      const feriasLucasRef = doc(db, EXCECOES_PATH, 'seed-ferias-lucas-2026');
      const feriasThiagoRef = doc(db, EXCECOES_PATH, 'seed-ferias-thiago-2027');
      const feriasLucasSnap = precisaCobertura && !precisaSecao7 ? await transaction.get(feriasLucasRef) : null;
      const feriasThiagoSnap = precisaCobertura && !precisaSecao7 ? await transaction.get(feriasThiagoRef) : null;

      const configFinal: EquipeConfigDoc = {
        vendedor1: existente?.vendedor1 || NOMES_PADRAO_COMPLETOS.vendedor1,
        vendedor2: existente?.vendedor2 || NOMES_PADRAO_COMPLETOS.vendedor2,
        admin1: existente?.admin1 || NOMES_PADRAO_COMPLETOS.admin1,
        admin2: existente?.admin2 || NOMES_PADRAO_COMPLETOS.admin2,
        gerente1: existente?.gerente1 || NOMES_PADRAO_COMPLETOS.gerente1,
        secao7Inicializada: true,
        coberturaInicializada: true,
        atualizadoEm: agora,
      };

      transaction.set(equipeRef, configFinal);

      if (precisaSecao7) {
        for (const item of seedExcecoesBase) {
          const { id, ...payload } = item;
          transaction.set(doc(db, EXCECOES_PATH, id), payload);
        }
      } else if (precisaCobertura) {
        if (feriasLucasSnap?.exists() && !feriasLucasSnap.data()?.quemCobre) {
          transaction.update(feriasLucasRef, { quemCobre: 'gerente1', atualizadoEm: agora });
        }
        if (feriasThiagoSnap?.exists() && !feriasThiagoSnap.data()?.quemCobre) {
          transaction.update(feriasThiagoRef, { quemCobre: 'gerente1', atualizadoEm: agora });
        }
      }

      if (precisaCobertura) {
        for (const cob of seedCoberturas) {
          const { id, ...payload } = cob;
          transaction.set(doc(db, EXCECOES_PATH, id), payload);
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, CONFIG_PATH);
  }
}

export function observarEquipe(
  onData: (nomes: NomesEquipe) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const equipeRef = doc(db, 'config', 'equipe');
  return onSnapshot(
    equipeRef,
    (snap) => {
      if (snap.exists()) {
        const d = snap.data() as Partial<EquipeConfigDoc>;
        onData({
          vendedor1: d.vendedor1 || NOMES_PADRAO_COMPLETOS.vendedor1,
          vendedor2: d.vendedor2 || NOMES_PADRAO_COMPLETOS.vendedor2,
          admin1: d.admin1 || NOMES_PADRAO_COMPLETOS.admin1,
          admin2: d.admin2 || NOMES_PADRAO_COMPLETOS.admin2,
          gerente1: d.gerente1 || NOMES_PADRAO_COMPLETOS.gerente1,
        });
      } else {
        onData({ ...NOMES_PADRAO_COMPLETOS });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, CONFIG_PATH);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function observarExcecoes(
  onData: (excecoes: Excecao[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, EXCECOES_PATH), orderBy('dataInicio', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const lista: Excecao[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Excecao, 'id'>),
      }));
      onData(lista);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, EXCECOES_PATH);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function observarHistorico(
  onData: (itens: HistoricoItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, HISTORICO_PATH), orderBy('criadoEm', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const lista: HistoricoItem[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<HistoricoItem, 'id'>),
      }));
      onData(lista);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, HISTORICO_PATH);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

async function registrarHistorico(item: Omit<HistoricoItem, 'id' | 'criadoEm'>): Promise<void> {
  const id = gerarIdDocumento('hist');
  const agora = new Date().toISOString();
  const payload: Omit<HistoricoItem, 'id'> = {
    acao: item.acao,
    categoria: item.categoria,
    afetado: item.afetado.slice(0, 100),
    periodo: item.periodo.slice(0, 40),
    motivo: item.motivo.slice(0, 200),
    detalhes: item.detalhes.slice(0, 300),
    criadoEm: agora,
  };
  try {
    await setDoc(doc(db, HISTORICO_PATH, id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${HISTORICO_PATH}/${id}`);
  }
}

export async function salvarNomesEquipe(
  novosNomes: NomesEquipe,
  nomesAnteriores: NomesEquipe
): Promise<void> {
  const agora = new Date().toISOString();
  const payload: EquipeConfigDoc = {
    vendedor1: novosNomes.vendedor1.trim().slice(0, 60) || NOMES_PADRAO_COMPLETOS.vendedor1,
    vendedor2: novosNomes.vendedor2.trim().slice(0, 60) || NOMES_PADRAO_COMPLETOS.vendedor2,
    admin1: novosNomes.admin1.trim().slice(0, 60) || NOMES_PADRAO_COMPLETOS.admin1,
    admin2: novosNomes.admin2.trim().slice(0, 60) || NOMES_PADRAO_COMPLETOS.admin2,
    gerente1: novosNomes.gerente1.trim().slice(0, 60) || NOMES_PADRAO_COMPLETOS.gerente1,
    secao7Inicializada: true,
    coberturaInicializada: true,
    atualizadoEm: agora,
  };

  try {
    await setDoc(doc(db, 'config', 'equipe'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, CONFIG_PATH);
  }

  const mudancas: string[] = [];
  if (nomesAnteriores.vendedor1 !== payload.vendedor1) {
    mudancas.push(`${nomesAnteriores.vendedor1} → ${payload.vendedor1}`);
  }
  if (nomesAnteriores.vendedor2 !== payload.vendedor2) {
    mudancas.push(`${nomesAnteriores.vendedor2} → ${payload.vendedor2}`);
  }
  if (nomesAnteriores.admin1 !== payload.admin1) {
    mudancas.push(`${nomesAnteriores.admin1} → ${payload.admin1}`);
  }
  if (nomesAnteriores.admin2 !== payload.admin2) {
    mudancas.push(`${nomesAnteriores.admin2} → ${payload.admin2}`);
  }
  if (nomesAnteriores.gerente1 !== payload.gerente1) {
    mudancas.push(`${nomesAnteriores.gerente1} → ${payload.gerente1}`);
  }

  if (mudancas.length > 0) {
    await registrarHistorico({
      acao: 'edicao',
      categoria: 'equipe',
      afetado: 'Nomes da equipe',
      periodo: 'Geral',
      motivo: 'Atualização de cadastro pelo gerente',
      detalhes: mudancas.join('; '),
    });
  }
}

function formatarPeriodoBR(inicio: string, fim: string): string {
  return inicio === fim
    ? formatarDataBR(inicio)
    : `${formatarDataBR(inicio)} a ${formatarDataBR(fim)}`;
}

export interface CriarExcecaoInput {
  tipo: Exclude<TipoExcecao, 'cobertura'>;
  funcionarioId: FuncionarioId | '';
  dataInicio: string;
  dataFim: string;
  novoEstado?: NovoEstadoTroca;
  quemCobre?: string;
  motivo: string;
  nomeAfetado: string;
  nomes?: NomesEquipe;
}

export async function criarExcecao(input: CriarExcecaoInput): Promise<void> {
  const id = gerarIdDocumento('exc');
  const agora = new Date().toISOString();

  const quemCobreId = input.tipo === 'ferias' ? (input.quemCobre || '').trim().slice(0, 60) : '';

  const payload = {
    tipo: input.tipo,
    funcionarioId: input.tipo === 'loja_fechada' ? '' : input.funcionarioId,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    novoEstado: input.tipo === 'troca_folga' ? input.novoEstado || 'folga' : '',
    quemCobre: quemCobreId,
    motivo: input.motivo.trim().slice(0, 200),
    criadoEm: agora,
    atualizadoEm: agora,
  };

  try {
    await setDoc(doc(db, EXCECOES_PATH, id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${EXCECOES_PATH}/${id}`);
  }

  const periodo = formatarPeriodoBR(payload.dataInicio, payload.dataFim);
  const nomeCobre = quemCobreId ? resolverNomePessoa(quemCobreId as PessoaId, input.nomes) : '';

  let detalhes = '';
  if (payload.tipo === 'ferias') {
    detalhes = nomeCobre ? `Férias cadastradas · cobertura: ${nomeCobre}` : 'Férias cadastradas';
  } else if (payload.tipo === 'ausencia') {
    detalhes = 'Ausência comum cadastrada';
  } else if (payload.tipo === 'troca_folga') {
    detalhes = `Alterado para ${payload.novoEstado === 'trabalha' ? 'Trabalha' : 'Folga'}`;
  } else {
    detalhes = 'Dia marcado como loja fechada';
  }

  await registrarHistorico({
    acao: 'criacao',
    categoria: payload.tipo,
    afetado: input.nomeAfetado,
    periodo,
    motivo: payload.motivo || 'Sem motivo informado',
    detalhes,
  });

  // Ao criar férias com "quem cobre", cria exceção de cobertura vinculada (origemFeriasId)
  if (payload.tipo === 'ferias' && quemCobreId && payload.funcionarioId) {
    await criarCobertura({
      coberturaPorId: quemCobreId as PessoaId,
      cobreFuncionarioId: payload.funcionarioId as FuncionarioId,
      dataInicio: payload.dataInicio,
      dataFim: payload.dataFim,
      modo: 'turno_completo',
      horaInicio: '',
      horaFim: '',
      origemFeriasId: id,
      motivo: 'Cobertura de férias',
      nomes: input.nomes,
    });
  }
}

export async function editarFerias(
  excecaoAtual: Excecao,
  dados: {
    funcionarioId: FuncionarioId;
    dataInicio: string;
    dataFim: string;
    quemCobre: string;
    motivo: string;
  },
  todasExcecoes: Excecao[],
  nomes: NomesEquipe
): Promise<void> {
  const agora = new Date().toISOString();
  const quemCobreId = dados.quemCobre.trim().slice(0, 60);
  const payloadUpdate = {
    funcionarioId: dados.funcionarioId,
    dataInicio: dados.dataInicio,
    dataFim: dados.dataFim,
    novoEstado: '' as const,
    quemCobre: quemCobreId,
    motivo: dados.motivo.trim().slice(0, 200),
    atualizadoEm: agora,
  };

  try {
    await updateDoc(doc(db, EXCECOES_PATH, excecaoAtual.id), payloadUpdate);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${EXCECOES_PATH}/${excecaoAtual.id}`);
  }

  const nomeAfetado = resolverNomePessoa(dados.funcionarioId, nomes);
  const nomeCobre = quemCobreId ? resolverNomePessoa(quemCobreId as PessoaId, nomes) : '';
  const periodo = formatarPeriodoBR(dados.dataInicio, dados.dataFim);

  await registrarHistorico({
    acao: 'edicao',
    categoria: 'ferias',
    afetado: nomeAfetado,
    periodo,
    motivo: payloadUpdate.motivo || 'Edição de férias',
    detalhes: nomeCobre ? `Férias atualizadas · cobertura: ${nomeCobre}` : 'Férias atualizadas',
  });

  // Sincroniza coberturas vinculadas a esta férias (origemFeriasId)
  const coberturasVinculadas = todasExcecoes.filter(
    (e) => e.tipo === 'cobertura' && e.origemFeriasId === excecaoAtual.id
  );

  if (!quemCobreId) {
    for (const cob of coberturasVinculadas) {
      await removerCoberturaDireta(cob, nomes, 'Remoção automática ao editar férias');
    }
    return;
  }

  if (coberturasVinculadas.length === 1) {
    const cob = coberturasVinculadas[0];
    try {
      await updateDoc(doc(db, EXCECOES_PATH, cob.id), {
        coberturaPorId: quemCobreId,
        cobreFuncionarioId: dados.funcionarioId,
        dataInicio: dados.dataInicio,
        dataFim: dados.dataFim,
        modo: 'turno_completo',
        horaInicio: '',
        horaFim: '',
        motivo: 'Cobertura de férias',
        atualizadoEm: agora,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${EXCECOES_PATH}/${cob.id}`);
    }

    await registrarHistorico({
      acao: 'edicao',
      categoria: 'cobertura',
      afetado: `${nomeCobre} cobrindo ${nomeAfetado}`,
      periodo,
      motivo: 'Cobertura de férias atualizada',
      detalhes: 'Modo turno completo sincronizado com férias',
    });
  } else {
    for (const cob of coberturasVinculadas) {
      await removerCoberturaDireta(cob, nomes, 'Reemissão ao editar férias');
    }
    await criarCobertura({
      coberturaPorId: quemCobreId as PessoaId,
      cobreFuncionarioId: dados.funcionarioId,
      dataInicio: dados.dataInicio,
      dataFim: dados.dataFim,
      modo: 'turno_completo',
      horaInicio: '',
      horaFim: '',
      origemFeriasId: excecaoAtual.id,
      motivo: 'Cobertura de férias',
      nomes,
    });
  }
}

export interface CriarCoberturaInput {
  coberturaPorId: PessoaId;
  cobreFuncionarioId: FuncionarioId;
  dataInicio: string;
  dataFim: string;
  modo: Exclude<ModoCobertura, ''>;
  horaInicio?: string;
  horaFim?: string;
  origemFeriasId?: string;
  motivo: string;
  nomes?: NomesEquipe;
}

export async function criarCobertura(input: CriarCoberturaInput): Promise<void> {
  const id = gerarIdDocumento('cob');
  const agora = new Date().toISOString();

  const payload = {
    tipo: 'cobertura' as const,
    funcionarioId: '',
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
    novoEstado: '',
    quemCobre: '',
    coberturaPorId: input.coberturaPorId,
    cobreFuncionarioId: input.cobreFuncionarioId,
    modo: input.modo,
    horaInicio: input.modo === 'faixa' ? input.horaInicio || '' : '',
    horaFim: input.modo === 'faixa' ? input.horaFim || '' : '',
    origemFeriasId: (input.origemFeriasId || '').slice(0, 128),
    motivo: input.motivo.trim().slice(0, 200) || 'Cobertura de vendas',
    criadoEm: agora,
    atualizadoEm: agora,
  };

  try {
    await setDoc(doc(db, EXCECOES_PATH, id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${EXCECOES_PATH}/${id}`);
  }

  const nomePor = resolverNomePessoa(input.coberturaPorId, input.nomes);
  const nomeCoberto = resolverNomePessoa(input.cobreFuncionarioId, input.nomes);
  const periodo = formatarPeriodoBR(input.dataInicio, input.dataFim);
  const detalhes =
    input.modo === 'faixa'
      ? `Faixa ${payload.horaInicio} às ${payload.horaFim}`
      : 'Turno completo da regra base';

  await registrarHistorico({
    acao: 'criacao',
    categoria: 'cobertura',
    afetado: `${nomePor} cobrindo ${nomeCoberto}`,
    periodo,
    motivo: payload.motivo,
    detalhes,
  });
}

async function removerCoberturaDireta(
  cobertura: Excecao,
  nomes: NomesEquipe,
  motivoHistorico?: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, EXCECOES_PATH, cobertura.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EXCECOES_PATH}/${cobertura.id}`);
  }

  const nomePor = resolverNomePessoa((cobertura.coberturaPorId || 'gerente1') as PessoaId, nomes);
  const nomeCoberto = resolverNomePessoa(
    (cobertura.cobreFuncionarioId || 'vendedor2') as PessoaId,
    nomes
  );

  await registrarHistorico({
    acao: 'remocao',
    categoria: 'cobertura',
    afetado: `${nomePor} cobrindo ${nomeCoberto}`,
    periodo: formatarPeriodoBR(cobertura.dataInicio, cobertura.dataFim),
    motivo: motivoHistorico || cobertura.motivo || 'Cobertura removida',
    detalhes: 'Cobertura removida',
  });
}

/**
 * Remove a cobertura apenas de um dia específico (dividindo períodos multi-dia se necessário).
 */
export async function removerCoberturaDeUmDia(
  cobertura: Excecao,
  dataAlvoISO: string,
  nomes: NomesEquipe,
  motivo: string
): Promise<void> {
  const agora = new Date().toISOString();
  const nomePor = resolverNomePessoa((cobertura.coberturaPorId || 'gerente1') as PessoaId, nomes);
  const nomeCoberto = resolverNomePessoa(
    (cobertura.cobreFuncionarioId || 'vendedor2') as PessoaId,
    nomes
  );

  if (cobertura.dataInicio === cobertura.dataFim) {
    await removerCoberturaDireta(cobertura, nomes, motivo || 'Cobertura do dia removida');
    return;
  }

  if (dataAlvoISO === cobertura.dataInicio) {
    const novoInicio = somarDias(dataAlvoISO, 1);
    try {
      await updateDoc(doc(db, EXCECOES_PATH, cobertura.id), {
        dataInicio: novoInicio,
        atualizadoEm: agora,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${EXCECOES_PATH}/${cobertura.id}`);
    }
  } else if (dataAlvoISO === cobertura.dataFim) {
    const novoFim = somarDias(dataAlvoISO, -1);
    try {
      await updateDoc(doc(db, EXCECOES_PATH, cobertura.id), {
        dataFim: novoFim,
        atualizadoEm: agora,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${EXCECOES_PATH}/${cobertura.id}`);
    }
  } else if (dataAlvoISO > cobertura.dataInicio && dataAlvoISO < cobertura.dataFim) {
    const fimParte1 = somarDias(dataAlvoISO, -1);
    const inicioParte2 = somarDias(dataAlvoISO, 1);
    const novoId = gerarIdDocumento('cob');

    try {
      await updateDoc(doc(db, EXCECOES_PATH, cobertura.id), {
        dataFim: fimParte1,
        atualizadoEm: agora,
      });
      await setDoc(doc(db, EXCECOES_PATH, novoId), {
        tipo: 'cobertura',
        funcionarioId: '',
        dataInicio: inicioParte2,
        dataFim: cobertura.dataFim,
        novoEstado: '',
        quemCobre: '',
        coberturaPorId: cobertura.coberturaPorId || 'gerente1',
        cobreFuncionarioId: cobertura.cobreFuncionarioId || 'vendedor2',
        modo: cobertura.modo || 'turno_completo',
        horaInicio: cobertura.modo === 'faixa' ? cobertura.horaInicio || '' : '',
        horaFim: cobertura.modo === 'faixa' ? cobertura.horaFim || '' : '',
        origemFeriasId: cobertura.origemFeriasId || '',
        motivo: cobertura.motivo || 'Cobertura',
        criadoEm: agora,
        atualizadoEm: agora,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${EXCECOES_PATH}/${cobertura.id}`);
    }
  }

  await registrarHistorico({
    acao: 'remocao',
    categoria: 'cobertura',
    afetado: `${nomePor} cobrindo ${nomeCoberto}`,
    periodo: formatarDataBR(dataAlvoISO),
    motivo: motivo.trim() || 'Dia removido da cobertura',
    detalhes: `Cobertura removida somente em ${formatarDataBR(dataAlvoISO)}`,
  });
}

/**
 * Troca a cobertura de um dia específico para o modo faixa, com motivo.
 */
export async function trocarCoberturaDeUmDiaPorFaixa(
  cobertura: Excecao,
  dataAlvoISO: string,
  horaInicio: string,
  horaFim: string,
  motivo: string,
  nomes: NomesEquipe
): Promise<void> {
  const agora = new Date().toISOString();
  const nomePor = resolverNomePessoa((cobertura.coberturaPorId || 'gerente1') as PessoaId, nomes);
  const nomeCoberto = resolverNomePessoa(
    (cobertura.cobreFuncionarioId || 'vendedor2') as PessoaId,
    nomes
  );

  if (cobertura.dataInicio === cobertura.dataFim) {
    try {
      await updateDoc(doc(db, EXCECOES_PATH, cobertura.id), {
        modo: 'faixa',
        horaInicio,
        horaFim,
        motivo: motivo.trim().slice(0, 200) || 'Faixa ajustada pelo gerente',
        atualizadoEm: agora,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${EXCECOES_PATH}/${cobertura.id}`);
    }

    await registrarHistorico({
      acao: 'edicao',
      categoria: 'cobertura',
      afetado: `${nomePor} cobrindo ${nomeCoberto}`,
      periodo: formatarDataBR(dataAlvoISO),
      motivo: motivo.trim() || 'Faixa ajustada',
      detalhes: `Trocada para faixa ${horaInicio} às ${horaFim}`,
    });
    return;
  }

  // Divide o intervalo original removendo dataAlvoISO e cria faixa só para dataAlvoISO
  if (dataAlvoISO === cobertura.dataInicio) {
    await updateDoc(doc(db, EXCECOES_PATH, cobertura.id), {
      dataInicio: somarDias(dataAlvoISO, 1),
      atualizadoEm: agora,
    });
  } else if (dataAlvoISO === cobertura.dataFim) {
    await updateDoc(doc(db, EXCECOES_PATH, cobertura.id), {
      dataFim: somarDias(dataAlvoISO, -1),
      atualizadoEm: agora,
    });
  } else {
    const novoId = gerarIdDocumento('cob');
    await updateDoc(doc(db, EXCECOES_PATH, cobertura.id), {
      dataFim: somarDias(dataAlvoISO, -1),
      atualizadoEm: agora,
    });
    await setDoc(doc(db, EXCECOES_PATH, novoId), {
      tipo: 'cobertura',
      funcionarioId: '',
      dataInicio: somarDias(dataAlvoISO, 1),
      dataFim: cobertura.dataFim,
      novoEstado: '',
      quemCobre: '',
      coberturaPorId: cobertura.coberturaPorId || 'gerente1',
      cobreFuncionarioId: cobertura.cobreFuncionarioId || 'vendedor2',
      modo: cobertura.modo || 'turno_completo',
      horaInicio: cobertura.modo === 'faixa' ? cobertura.horaInicio || '' : '',
      horaFim: cobertura.modo === 'faixa' ? cobertura.horaFim || '' : '',
      origemFeriasId: cobertura.origemFeriasId || '',
      motivo: cobertura.motivo || 'Cobertura',
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  const faixaId = gerarIdDocumento('cob');
  await setDoc(doc(db, EXCECOES_PATH, faixaId), {
    tipo: 'cobertura',
    funcionarioId: '',
    dataInicio: dataAlvoISO,
    dataFim: dataAlvoISO,
    novoEstado: '',
    quemCobre: '',
    coberturaPorId: cobertura.coberturaPorId || 'gerente1',
    cobreFuncionarioId: cobertura.cobreFuncionarioId || 'vendedor2',
    modo: 'faixa',
    horaInicio,
    horaFim,
    origemFeriasId: cobertura.origemFeriasId || '',
    motivo: motivo.trim().slice(0, 200) || 'Faixa ajustada pelo gerente',
    criadoEm: agora,
    atualizadoEm: agora,
  });

  await registrarHistorico({
    acao: 'edicao',
    categoria: 'cobertura',
    afetado: `${nomePor} cobrindo ${nomeCoberto}`,
    periodo: formatarDataBR(dataAlvoISO),
    motivo: motivo.trim() || 'Faixa ajustada',
    detalhes: `Dia trocado para faixa ${horaInicio} às ${horaFim}`,
  });
}

export async function removerExcecao(
  excecao: Excecao,
  todasExcecoes: Excecao[],
  nomes: NomesEquipe
): Promise<void> {
  if (excecao.tipo === 'cobertura') {
    await removerCoberturaDireta(excecao, nomes);
    return;
  }

  try {
    await deleteDoc(doc(db, EXCECOES_PATH, excecao.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EXCECOES_PATH}/${excecao.id}`);
  }

  const nomeAfetado = excecao.funcionarioId
    ? resolverNomePessoa(excecao.funcionarioId, nomes)
    : 'Loja inteira';
  const periodo = formatarPeriodoBR(excecao.dataInicio, excecao.dataFim);

  const labelCategoria =
    excecao.tipo === 'ferias'
      ? 'Férias removidas'
      : excecao.tipo === 'ausencia'
        ? 'Ausência removida'
        : excecao.tipo === 'troca_folga'
          ? 'Troca de folga removida'
          : 'Feriado removido';

  await registrarHistorico({
    acao: 'remocao',
    categoria: excecao.tipo,
    afetado: nomeAfetado,
    periodo,
    motivo: excecao.motivo || 'Remoção pelo gerente',
    detalhes: labelCategoria,
  });

  // Se remover férias, remove todas as coberturas ligadas a elas
  if (excecao.tipo === 'ferias') {
    const vinculadas = todasExcecoes.filter(
      (e) => e.tipo === 'cobertura' && e.origemFeriasId === excecao.id
    );
    for (const cob of vinculadas) {
      await removerCoberturaDireta(cob, nomes, 'Cobertura removida junto com as férias');
    }
  }
}
