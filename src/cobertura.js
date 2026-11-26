/**
 * Módulo puro para lógica da equipe Gerência (gerente1) e Cobertura de vendas.
 * Sem dependências de banco de dados ou React.
 */

import {
  analisarDiaLoja,
  calcularEscalaDia,
  calcularTurnoBase,
  DATA_INICIO_NOVA_ESCALA,
  DIAS_SEMANA_CURTOS,
  formatarDataBR,
  formatarMinutosEmHoras,
  FUNCIONARIOS_LISTA,
  obterInfoSemana,
  paraDataISO,
  somarDias,
} from './escala.js';

export const GERENTE_META = {
  id: 'gerente1',
  nomePadrao: 'João',
  equipe: 'Gerência',
};

export const NOMES_PADRAO_COMPLETOS = {
  vendedor1: 'Thiago',
  vendedor2: 'Lucas',
  admin1: 'Murillo',
  admin2: 'Maria',
  gerente1: 'João',
};

const INICIO_LOJA_MIN = 8 * 60 + 30; // 08:30 -> 510
const FIM_LOJA_MIN = 19 * 60 + 30; // 19:30 -> 1170

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function paraMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

export function minutosParaHHMM(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function resolverNomePessoa(pessoaId, nomes = NOMES_PADRAO_COMPLETOS) {
  if (!pessoaId) return '';
  if (nomes && nomes[pessoaId]) return nomes[pessoaId];
  if (pessoaId === 'gerente1') return GERENTE_META.nomePadrao;
  const meta = FUNCIONARIOS_LISTA.find((f) => f.id === pessoaId);
  return meta ? meta.nomePadrao : pessoaId;
}

/**
 * Subtrai uma lista de intervalos cobertos [ini, fim] de um intervalo base [baseIni, baseFim].
 */
export function subtrairIntervalos(baseIni, baseFim, intervalosCobertos) {
  if (!intervalosCobertos || intervalosCobertos.length === 0) {
    return [[baseIni, baseFim]];
  }

  const ordenados = intervalosCobertos
    .map(([a, b]) => [Math.max(baseIni, a), Math.min(baseFim, b)])
    .filter(([a, b]) => a < b)
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);

  if (ordenados.length === 0) {
    return [[baseIni, baseFim]];
  }

  // Mescla sobreposições
  const mesclados = [ordenados[0]];
  for (let i = 1; i < ordenados.length; i++) {
    const ultimo = mesclados[mesclados.length - 1];
    const atual = ordenados[i];
    if (atual[0] <= ultimo[1]) {
      ultimo[1] = Math.max(ultimo[1], atual[1]);
    } else {
      mesclados.push(atual);
    }
  }

  const descobertos = [];
  let cursor = baseIni;
  for (const [ini, fim] of mesclados) {
    if (cursor < ini) {
      descobertos.push([cursor, ini]);
    }
    cursor = Math.max(cursor, fim);
  }
  if (cursor < baseFim) {
    descobertos.push([cursor, baseFim]);
  }
  return descobertos;
}

/**
 * Retorna as coberturas ativas em uma data específica.
 */
export function obterCoberturasDoDia(data, excecoes = [], nomes = NOMES_PADRAO_COMPLETOS) {
  const dataISO = paraDataISO(data);
  const { diaSemana } = obterInfoSemana(dataISO);

  // Loja fechada no domingo ou por feriado -> não há cobertura ativa
  const excLoja = Array.isArray(excecoes)
    ? excecoes.find(
        (e) => e && e.tipo === 'loja_fechada' && dataISO >= e.dataInicio && dataISO <= e.dataFim
      )
    : null;
  if (diaSemana === 6 || excLoja) {
    return [];
  }

  const ativas = [];
  for (const exc of excecoes || []) {
    if (!exc || exc.tipo !== 'cobertura') continue;
    if (!exc.dataInicio || !exc.dataFim) continue;
    if (dataISO < exc.dataInicio || dataISO > exc.dataFim) continue;
    if (!exc.coberturaPorId || !exc.cobreFuncionarioId) continue;

    if (exc.modo === 'turno_completo') {
      const turnoBase = calcularTurnoBase(dataISO, exc.cobreFuncionarioId);
      // Nos dias de folga pela regra base do funcionário coberto, não há cobertura
      if (!turnoBase.trabalha || !turnoBase.horario) continue;

      ativas.push({
        excecaoId: exc.id,
        coberturaPorId: exc.coberturaPorId,
        coberturaPorNome: resolverNomePessoa(exc.coberturaPorId, nomes),
        cobreFuncionarioId: exc.cobreFuncionarioId,
        cobreFuncionarioNome: resolverNomePessoa(exc.cobreFuncionarioId, nomes),
        inicio: turnoBase.horario.inicio,
        fim: turnoBase.horario.fim,
        texto: turnoBase.horario.texto,
        minutos: turnoBase.horario.minutos,
        modo: 'turno_completo',
        motivo: exc.motivo || 'Cobertura de turno',
        origemFeriasId: exc.origemFeriasId || '',
        alterado: true,
      });
    } else if (exc.modo === 'faixa' && exc.horaInicio && exc.horaFim) {
      const iniMin = paraMinutos(exc.horaInicio);
      const fimMin = paraMinutos(exc.horaFim);
      if (iniMin >= fimMin) continue;

      ativas.push({
        excecaoId: exc.id,
        coberturaPorId: exc.coberturaPorId,
        coberturaPorNome: resolverNomePessoa(exc.coberturaPorId, nomes),
        cobreFuncionarioId: exc.cobreFuncionarioId,
        cobreFuncionarioNome: resolverNomePessoa(exc.cobreFuncionarioId, nomes),
        inicio: exc.horaInicio,
        fim: exc.horaFim,
        texto: `${exc.horaInicio} às ${exc.horaFim}`,
        minutos: fimMin - iniMin,
        modo: 'faixa',
        motivo: exc.motivo || 'Cobertura por faixa',
        origemFeriasId: exc.origemFeriasId || '',
        alterado: true,
      });
    }
  }

  return ativas;
}

function sugerirVendedorParaIntervalo(iniMin, fimMin, diaLoja) {
  const ausentes = diaLoja.vendedores.filter((v) => !v.trabalha);
  if (ausentes.length === 1) return ausentes[0].funcionarioId;
  // Se ambos estão fora, sugere quem normalmente cobriria aquela ponta
  if (iniMin < 630) return 'vendedor1'; // 08:30-10:30
  if (fimMin > 1050) return 'vendedor2'; // 17:30-19:30
  return 'vendedor1';
}

/**
 * Analisa a cobertura de vendas de um dia: coberturas ativas, intervalos descobertos,
 * sobreposição de João e mensagens neutras vs âmbar.
 */
export function analisarCoberturaDia(data, excecoes = [], nomes = NOMES_PADRAO_COMPLETOS) {
  const dataISO = paraDataISO(data);
  const diaLoja = analisarDiaLoja(dataISO, excecoes, nomes);
  const coberturas = obterCoberturasDoDia(dataISO, excecoes, nomes);
  const coberturasGerencia = coberturas.filter((c) => c.coberturaPorId === 'gerente1');

  // Verifica sobreposição de horários para João
  let coberturaSobrepostaGerente = false;
  for (let i = 0; i < coberturasGerencia.length; i++) {
    for (let j = i + 1; j < coberturasGerencia.length; j++) {
      const aIni = paraMinutos(coberturasGerencia[i].inicio);
      const aFim = paraMinutos(coberturasGerencia[i].fim);
      const bIni = paraMinutos(coberturasGerencia[j].inicio);
      const bFim = paraMinutos(coberturasGerencia[j].fim);
      if (aIni < bFim && bIni < aFim) {
        coberturaSobrepostaGerente = true;
      }
    }
  }

  if (diaLoja.lojaFechada || diaLoja.antesDoInicio) {
    return {
      data: dataISO,
      lojaFechada: diaLoja.lojaFechada,
      antesDoInicio: diaLoja.antesDoInicio,
      coberturas,
      coberturasGerencia,
      intervalosDescobertos: [],
      totalmenteCoberto: false,
      parcialmenteCoberto: false,
      diaSemVendedorENemCobertura: false,
      coberturaSobrepostaGerente,
      resumoNeutralCobertura: null,
      alertaAmbarCobertura: null,
    };
  }

  const vendedoresPresentes = diaLoja.vendedores.filter((v) => v.trabalha && v.horario);
  const coberturasVendas = coberturas.filter(
    (c) => c.cobreFuncionarioId === 'vendedor1' || c.cobreFuncionarioId === 'vendedor2'
  );

  const intervalosCobertos = [
    ...vendedoresPresentes.map((v) => [paraMinutos(v.horario.inicio), paraMinutos(v.horario.fim)]),
    ...coberturasVendas.map((c) => [paraMinutos(c.inicio), paraMinutos(c.fim)]),
  ];

  const descobertosRaw = subtrairIntervalos(INICIO_LOJA_MIN, FIM_LOJA_MIN, intervalosCobertos);
  const intervalosDescobertos = descobertosRaw.map(([ini, fim]) => {
    const inicio = minutosParaHHMM(ini);
    const fimStr = minutosParaHHMM(fim);
    return {
      inicio,
      fim: fimStr,
      texto: `${inicio} às ${fimStr}`,
      cobreFuncionarioSugeridoId: sugerirVendedorParaIntervalo(ini, fim, diaLoja),
    };
  });

  const temCoberturaVendas = coberturasVendas.length > 0;
  const totalmenteCoberto = intervalosDescobertos.length === 0 && temCoberturaVendas;
  const parcialmenteCoberto =
    intervalosDescobertos.length > 0 && (vendedoresPresentes.length > 0 || temCoberturaVendas);
  const diaSemVendedorENemCobertura =
    vendedoresPresentes.length === 0 && !temCoberturaVendas;

  let resumoNeutralCobertura = null;
  if (totalmenteCoberto) {
    const detalhes = coberturasVendas.map(
      (c) => `${c.coberturaPorNome} (${c.texto}, no lugar de ${c.cobreFuncionarioNome})`
    );
    resumoNeutralCobertura = `Coberto por ${detalhes.join(' · ')}`;
  }

  let alertaAmbarCobertura = null;
  if (diaSemVendedorENemCobertura) {
    alertaAmbarCobertura = {
      tipo: 'sem_vendedor',
      titulo: 'Dia sem vendedor',
      mensagem: `Nenhum vendedor trabalhando nem cobertura cadastrada (${intervalosDescobertos
        .map((i) => i.texto)
        .join(', ')}).`,
      intervalosParaCobrir: intervalosDescobertos,
    };
  } else if (parcialmenteCoberto) {
    const intervalosTexto = intervalosDescobertos.map((i) => i.texto).join(', ');
    alertaAmbarCobertura = {
      tipo: 'parcialmente_coberto',
      titulo: 'Horário descoberto',
      mensagem: `Horário sem vendedor: ${intervalosTexto}.`,
      intervalosParaCobrir: intervalosDescobertos,
    };
  } else if (
    vendedoresPresentes.length === 1 &&
    !temCoberturaVendas &&
    (diaLoja.diaSemana === 0 || diaLoja.diaSemana === 5)
  ) {
    // Segunda ou Sábado normal com 1 vendedor trabalhando 08:30 às 19:30
    const unico = vendedoresPresentes[0];
    alertaAmbarCobertura = {
      tipo: 'vendedor_unico_padrao',
      titulo: 'Vendedor único na loja',
      mensagem: `${unico.nome} abre e fecha a loja (${unico.horario?.texto}). Fica sozinho na loja após as 17:54 (saída do administrativo).`,
      intervalosParaCobrir: [],
    };
  }

  return {
    data: dataISO,
    lojaFechada: false,
    antesDoInicio: false,
    coberturas,
    coberturasGerencia,
    intervalosDescobertos,
    totalmenteCoberto,
    parcialmenteCoberto,
    diaSemVendedorENemCobertura,
    coberturaSobrepostaGerente,
    resumoNeutralCobertura,
    alertaAmbarCobertura,
  };
}

/**
 * Soma as horas de cobertura de uma pessoa (ex.: gerente1) em uma semana.
 */
export function calcularResumoCoberturaSemana(
  dataQualquerDaSemana,
  pessoaId = 'gerente1',
  excecoes = [],
  nomes = NOMES_PADRAO_COMPLETOS
) {
  const { diasDaSemana } = obterInfoSemana(dataQualquerDaSemana);
  let minutos = 0;
  let diasCobrindo = 0;

  for (const diaISO of diasDaSemana) {
    const cobDia = obterCoberturasDoDia(diaISO, excecoes, nomes).filter(
      (c) => c.coberturaPorId === pessoaId
    );
    if (cobDia.length > 0) {
      diasCobrindo += 1;
      for (const c of cobDia) {
        minutos += c.minutos;
      }
    }
  }

  return { minutos, diasCobrindo };
}

/**
 * Verifica se gerente1 fica mais de 5 dias seguidos cobrindo em uma janela mensal/global.
 */
export function detectarSequenciasLongasCobertura(
  excecoes = [],
  pessoaId = 'gerente1',
  nomes = NOMES_PADRAO_COMPLETOS
) {
  let fimAnalise = somarDias(DATA_INICIO_NOVA_ESCALA, 90);
  for (const exc of excecoes || []) {
    if (exc?.dataFim) {
      const cand = somarDias(exc.dataFim, 7);
      if (cand > fimAnalise) fimAnalise = cand;
    }
  }

  const alertas = [];
  let streak = 0;
  const emitidasPorSemana = new Set();

  for (let offset = 0; offset < 240; offset++) {
    const dataISO = somarDias(DATA_INICIO_NOVA_ESCALA, offset);
    if (dataISO > fimAnalise) break;

    const cobDia = obterCoberturasDoDia(dataISO, excecoes, nomes).filter(
      (c) => c.coberturaPorId === pessoaId
    );
    if (cobDia.length > 0) {
      streak += 1;
      if (streak > 5) {
        const { segundaISO } = obterInfoSemana(dataISO);
        if (!emitidasPorSemana.has(segundaISO)) {
          emitidasPorSemana.add(segundaISO);
          const nome = resolverNomePessoa(pessoaId, nomes);
          alertas.push({
            id: `cob-streak-${pessoaId}-${dataISO}`,
            tipo: 'cobertura_mais_de_5_dias',
            titulo: `Mais de 5 dias seguidos cobrindo · ${nome}`,
            mensagem: `${nome} atinge ${streak} dias seguidos de cobertura em ${formatarDataBR(dataISO)}.`,
            data: dataISO,
          });
        }
      }
    } else {
      streak = 0;
    }
  }

  return alertas;
}

/**
 * Gera todos os alertas gerenciais considerando cobertura (âmbar só no que ficou descoberto,
 * sobreposição de cobertura do gerente, >5 dias cobrindo, férias sobrepostas, >42h e >5 dias).
 */
export function gerarAlertasGerenteComCobertura(excecoes = [], nomes = NOMES_PADRAO_COMPLETOS) {
  const alertas = [];
  const feriasList = (excecoes || []).filter((e) => e && e.tipo === 'ferias');

  // 1. Férias sobrepostas na mesma equipe
  for (let i = 0; i < feriasList.length; i++) {
    for (let j = i + 1; j < feriasList.length; j++) {
      const a = feriasList[i];
      const b = feriasList[j];
      if (!a.funcionarioId || !b.funcionarioId || a.funcionarioId === b.funcionarioId) continue;
      const metaA = FUNCIONARIOS_LISTA.find((f) => f.id === a.funcionarioId);
      const metaB = FUNCIONARIOS_LISTA.find((f) => f.id === b.funcionarioId);
      if (!metaA || !metaB || metaA.equipe !== metaB.equipe) continue;

      if (a.dataInicio <= b.dataFim && b.dataInicio <= a.dataFim) {
        const inicioSobre = a.dataInicio > b.dataInicio ? a.dataInicio : b.dataInicio;
        const fimSobre = a.dataFim < b.dataFim ? a.dataFim : b.dataFim;
        alertas.push({
          id: `ferias-sobrepostas-${a.id || i}-${b.id || j}`,
          tipo: 'ferias_sobrepostas',
          titulo: `Férias sobrepostas em ${metaA.equipe}`,
          mensagem: `${resolverNomePessoa(a.funcionarioId, nomes)} e ${resolverNomePessoa(
            b.funcionarioId,
            nomes
          )} têm férias sobrepostas de ${formatarDataBR(inicioSobre)} a ${formatarDataBR(fimSobre)}.`,
          data: inicioSobre,
        });
      }
    }
  }

  let fimAnalise = somarDias(DATA_INICIO_NOVA_ESCALA, 90);
  for (const exc of excecoes || []) {
    if (exc?.dataFim) {
      const cand = somarDias(exc.dataFim, 14);
      if (cand > fimAnalise) fimAnalise = cand;
    }
  }

  const streakPorFunc = { vendedor1: 0, vendedor2: 0, admin1: 0, admin2: 0 };
  const alerta5DiasEmitido = new Set();
  const minutosSemanaMap = new Map();
  const nomeGerente = resolverNomePessoa('gerente1', nomes);

  for (let offset = 0; offset < 240; offset++) {
    const dataISO = somarDias(DATA_INICIO_NOVA_ESCALA, offset);
    if (dataISO > fimAnalise) break;

    const { diaSemana, segundaISO } = obterInfoSemana(dataISO);
    const cob = analisarCoberturaDia(dataISO, excecoes, nomes);

    if (!cob.lojaFechada) {
      // 2. Cobertura sobreposta para João
      if (cob.coberturaSobrepostaGerente) {
        alertas.push({
          id: `cob-sobreposta-${dataISO}`,
          tipo: 'cobertura_sobreposta',
          titulo: `Cobertura sobreposta (${nomeGerente}) · ${formatarDataBR(dataISO)}`,
          mensagem: `${nomeGerente} tem duas coberturas em horários sobrepostos em ${formatarDataBR(
            dataISO
          )} (${cob.coberturasGerencia.map((c) => `${c.texto} [${c.cobreFuncionarioNome}]`).join(' e ')}).`,
          data: dataISO,
        });
      }

      // 3. Dia sem vendedor ou horário parcialmente coberto (só o que continuar descoberto)
      if (cob.diaSemVendedorENemCobertura) {
        const intervalo = cob.intervalosDescobertos[0];
        alertas.push({
          id: `sem-vendedor-${dataISO}`,
          tipo: 'sem_vendedor',
          titulo: `Dia sem vendedor · ${formatarDataBR(dataISO)}`,
          mensagem: `Nenhum vendedor nem cobertura em ${formatarDataBR(dataISO)} (${DIAS_SEMANA_CURTOS[diaSemana]}). Descoberto: ${intervalo?.texto || '08:30 às 19:30'}.`,
          data: dataISO,
          intervalo,
        });
      } else if (cob.parcialmenteCoberto) {
        for (const intervalo of cob.intervalosDescobertos) {
          alertas.push({
            id: `descoberto-${dataISO}-${intervalo.inicio}`,
            tipo: 'horario_descoberto',
            titulo: `Horário descoberto · ${formatarDataBR(dataISO)}`,
            mensagem: `Em ${formatarDataBR(dataISO)} (${DIAS_SEMANA_CURTOS[diaSemana]}), intervalo sem vendedor: ${intervalo.texto}.`,
            data: dataISO,
            intervalo,
          });
        }
      }
    }

    // 4 & 5. >5 dias seguidos e >42h na semana para funcionários fixos
    for (const meta of FUNCIONARIOS_LISTA) {
      const calc = calcularEscalaDia(dataISO, meta.id, excecoes);
      const nome = resolverNomePessoa(meta.id, nomes);
      if (calc.trabalha) {
        streakPorFunc[meta.id] += 1;
        if (streakPorFunc[meta.id] > 5) {
          const chave = `${meta.id}|${segundaISO}`;
          if (!alerta5DiasEmitido.has(chave)) {
            alerta5DiasEmitido.add(chave);
            alertas.push({
              id: `streak-${meta.id}-${dataISO}`,
              tipo: 'mais_de_5_dias',
              titulo: `Mais de 5 dias seguidos · ${nome}`,
              mensagem: `${nome} atinge ${streakPorFunc[meta.id]} dias seguidos de trabalho em ${formatarDataBR(dataISO)}.`,
              data: dataISO,
            });
          }
        }
        const chaveSem = `${segundaISO}|${meta.id}`;
        minutosSemanaMap.set(chaveSem, (minutosSemanaMap.get(chaveSem) || 0) + calc.minutosTrabalhados);
      } else {
        streakPorFunc[meta.id] = 0;
      }
    }
  }

  for (const [chave, minutos] of minutosSemanaMap.entries()) {
    if (minutos > 2520) {
      const [segundaISO, funcId] = chave.split('|');
      alertas.push({
        id: `acima-42h-${funcId}-${segundaISO}`,
        tipo: 'acima_42h',
        titulo: `Acima de 42h na semana · ${resolverNomePessoa(funcId, nomes)}`,
        mensagem: `${resolverNomePessoa(funcId, nomes)} soma ${formatarMinutosEmHoras(
          minutos
        )} na semana de ${formatarDataBR(segundaISO)}.`,
        data: segundaISO,
      });
    }
  }

  const alertasStreakCob = detectarSequenciasLongasCobertura(excecoes, 'gerente1', nomes);
  return [...alertas, ...alertasStreakCob];
}

/**
 * Exceções pré-cadastradas (Seção 7 + coberturas de João) para os testes de cobertura.
 */
export const EXCECOES_PRE_CADASTRADAS_TESTE = [
  {
    id: 'seed-ferias-lucas-2026',
    tipo: 'ferias',
    funcionarioId: 'vendedor2',
    dataInicio: '2026-12-01',
    dataFim: '2026-12-30',
    novoEstado: '',
    quemCobre: 'gerente1',
    motivo: 'Férias programadas (volta em 02/01)',
  },
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
  },
];

/**
 * Executa os 5 novos casos de teste de Cobertura & Gerência com datas fixas
 * sobre as exceções pré-cadastradas.
 */
export function executarTestesCobertura() {
  const resultados = [];
  const excs = EXCECOES_PRE_CADASTRADAS_TESTE;

  // Caso C1: 15/12/2026 (terça)
  {
    const data = '2026-12-15';
    const t = calcularEscalaDia(data, 'vendedor1', excs);
    const l = calcularEscalaDia(data, 'vendedor2', excs);
    const cob = analisarCoberturaDia(data, excs, NOMES_PADRAO_COMPLETOS);
    const cobJoao = cob.coberturasGerencia[0];
    const ok =
      t.trabalha &&
      t.horario?.texto === '08:30 às 17:30' &&
      l.status === 'ferias' &&
      l.rotulo === 'Férias' &&
      Boolean(cobJoao) &&
      cobJoao.texto === '10:30 às 19:30' &&
      cob.totalmenteCoberto &&
      cob.intervalosDescobertos.length === 0;

    resultados.push({
      id: 'cob-1',
      titulo: '15/12/2026 (terça) — Cobertura total com João',
      esperado:
        'Thiago 08:30 às 17:30 · Lucas em Férias · João cobre 10:30 às 19:30 · dia totalmente coberto',
      obtido: `Thiago ${t.horario?.texto || t.rotulo} · Lucas ${l.rotulo} · João ${
        cobJoao ? cobJoao.texto : 'sem cobertura'
      } · ${cob.totalmenteCoberto ? 'totalmente coberto' : 'descoberto'}`,
      ok,
    });
  }

  // Caso C2: 19/12/2026 (sábado)
  {
    const data = '2026-12-19';
    const t = calcularEscalaDia(data, 'vendedor1', excs);
    const l = calcularEscalaDia(data, 'vendedor2', excs);
    const cob = analisarCoberturaDia(data, excs, NOMES_PADRAO_COMPLETOS);
    const cobJoao = cob.coberturasGerencia[0];
    const ok =
      !t.trabalha &&
      l.status === 'ferias' &&
      Boolean(cobJoao) &&
      cobJoao.texto === '08:30 às 19:30' &&
      cobJoao.cobreFuncionarioId === 'vendedor2' &&
      cob.totalmenteCoberto;

    resultados.push({
      id: 'cob-2',
      titulo: '19/12/2026 (sábado) — João cobre Lucas o dia todo',
      esperado:
        'João cobre 08:30 às 19:30 no lugar do Lucas · sem vendedor trabalhando além de João',
      obtido: `João ${cobJoao ? `${cobJoao.texto} (lugar de ${cobJoao.cobreFuncionarioNome})` : 'sem cobertura'} · Thiago ${t.rotulo} · Lucas ${l.rotulo}`,
      ok,
    });
  }

  // Caso C3: 21/12/2026 (segunda)
  {
    const data = '2026-12-21';
    const t = calcularEscalaDia(data, 'vendedor1', excs);
    const l = calcularEscalaDia(data, 'vendedor2', excs);
    const cob = analisarCoberturaDia(data, excs, NOMES_PADRAO_COMPLETOS);
    const cobJoao = cob.coberturasGerencia[0];
    const ok =
      !t.trabalha &&
      l.status === 'ferias' &&
      Boolean(cobJoao) &&
      cobJoao.texto === '08:30 às 19:30' &&
      cobJoao.cobreFuncionarioId === 'vendedor2';

    resultados.push({
      id: 'cob-3',
      titulo: '21/12/2026 (segunda) — João cobre Lucas (Semana 2)',
      esperado: 'João cobre 08:30 às 19:30 no lugar do Lucas',
      obtido: `João ${cobJoao ? `${cobJoao.texto} (lugar de ${cobJoao.cobreFuncionarioNome})` : 'sem cobertura'} · Thiago ${t.rotulo}`,
      ok,
    });
  }

  // Caso C4: 19/12/2026 sem a cobertura
  {
    const data = '2026-12-19';
    const excsSemCobertura = excs.filter((e) => e.tipo !== 'cobertura');
    const cob = analisarCoberturaDia(data, excsSemCobertura, NOMES_PADRAO_COMPLETOS);
    const ok =
      cob.diaSemVendedorENemCobertura &&
      cob.alertaAmbarCobertura?.tipo === 'sem_vendedor' &&
      cob.alertaAmbarCobertura.titulo.toLowerCase().includes('dia sem vendedor');

    resultados.push({
      id: 'cob-4',
      titulo: '19/12/2026 sem cobertura — Alerta âmbar "dia sem vendedor"',
      esperado: 'Alerta âmbar "Dia sem vendedor"',
      obtido: cob.alertaAmbarCobertura
        ? `${cob.alertaAmbarCobertura.titulo} (${cob.alertaAmbarCobertura.tipo})`
        : 'Sem alerta',
      ok,
    });
  }

  // Caso C5: 31/12/2026 (quinta)
  {
    const data = '2026-12-31';
    const l = calcularEscalaDia(data, 'vendedor2', excs);
    const cob = analisarCoberturaDia(data, excs, NOMES_PADRAO_COMPLETOS);
    const cobJoao = cob.coberturasGerencia[0];
    const ok =
      !l.trabalha &&
      l.rotulo === 'Folga' &&
      Boolean(cobJoao) &&
      cobJoao.texto === '10:30 às 19:30' &&
      cobJoao.cobreFuncionarioId === 'vendedor2';

    resultados.push({
      id: 'cob-5',
      titulo: '31/12/2026 (quinta) — Folga do Lucas + cobertura João',
      esperado: 'Lucas em Folga (gerente cobre) e João cobre 10:30 às 19:30',
      obtido: `Lucas ${l.rotulo} (${l.motivoAlteracao}) · João ${cobJoao ? cobJoao.texto : 'sem cobertura'}`,
      ok,
    });
  }

  return {
    total: resultados.length,
    aprovados: resultados.filter((r) => r.ok).length,
    resultados,
  };
}
