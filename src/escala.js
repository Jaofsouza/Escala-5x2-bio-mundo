/**
 * Motor puro de cálculo da Escala da Loja.
 * Sem dependências de banco de dados ou React.
 * Todas as datas são manipuladas como datas puras de calendário (ano, mês, dia)
 * em UTC para evitar desvios de fuso horário ou horário de verão perto da meia-noite.
 */

export const DATA_BASE_SEMANA_0 = '2026-12-14'; // Segunda-feira da Semana 1 (n = 0)
export const DATA_INICIO_NOVA_ESCALA = '2026-12-15'; // Terça-feira 15/12/2026

export const FUNCIONARIOS_LISTA = [
  {
    id: 'vendedor1',
    nomePadrao: 'Thiago',
    equipe: 'Vendedores',
    papel: 'funcionario1',
    turno: 'manhã',
  },
  {
    id: 'vendedor2',
    nomePadrao: 'Lucas',
    equipe: 'Vendedores',
    papel: 'funcionario2',
    turno: 'tarde',
  },
  {
    id: 'admin1',
    nomePadrao: 'Murillo',
    equipe: 'Administrativo',
    papel: 'funcionario1',
    turno: '',
  },
  {
    id: 'admin2',
    nomePadrao: 'Maria',
    equipe: 'Administrativo',
    papel: 'funcionario2',
    turno: '',
  },
];

export const NOMES_PADRAO = {
  vendedor1: 'Thiago',
  vendedor2: 'Lucas',
  admin1: 'Murillo',
  admin2: 'Maria',
};

export const DIAS_SEMANA_COMPLETOS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const DIAS_SEMANA_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const MESES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MS_POR_DIA = 86400000;

function pad2(num) {
  return String(num).padStart(2, '0');
}

/**
 * Converte string 'YYYY-MM-DD' ou objeto { ano, mes, dia } em { ano, mes, dia }.
 */
export function parseDataCalendario(data) {
  if (typeof data === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.trim());
    if (!match) {
      throw new Error(`Data inválida: ${data}`);
    }
    return {
      ano: Number(match[1]),
      mes: Number(match[2]),
      dia: Number(match[3]),
    };
  }
  if (data && typeof data === 'object' && 'ano' in data && 'mes' in data && 'dia' in data) {
    return {
      ano: Number(data.ano),
      mes: Number(data.mes),
      dia: Number(data.dia),
    };
  }
  throw new Error('Formato de data não suportado.');
}

export function paraDataISO(data) {
  const { ano, mes, dia } = parseDataCalendario(data);
  return `${ano}-${pad2(mes)}-${pad2(dia)}`;
}

export function formatarDataBR(data) {
  const { ano, mes, dia } = parseDataCalendario(data);
  return `${pad2(dia)}/${pad2(mes)}/${ano}`;
}

export function formatarDiaMesBR(data) {
  const { mes, dia } = parseDataCalendario(data);
  return `${pad2(dia)}/${pad2(mes)}`;
}

function paraUTCMs(data) {
  const { ano, mes, dia } = parseDataCalendario(data);
  return Date.UTC(ano, mes - 1, dia);
}

function deUTCMsParaISO(utcMs) {
  const d = new Date(utcMs);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function somarDias(data, deltaDias) {
  const utcMs = paraUTCMs(data);
  return deUTCMsParaISO(utcMs + deltaDias * MS_POR_DIA);
}

export function diasNoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

export function obterHojeSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const mapa = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      mapa[part.type] = part.value;
    }
  }
  return `${mapa.year}-${mapa.month}-${mapa.day}`;
}

const REF_SEGUNDA_MS = paraUTCMs(DATA_BASE_SEMANA_0);

/**
 * Calcula semana n (começando em 0 em 14/12/2026) e dia da semana (0=Seg ... 6=Dom).
 */
export function obterInfoSemana(data) {
  const dataISO = paraDataISO(data);
  const targetMs = paraUTCMs(dataISO);
  const diffDias = Math.round((targetMs - REF_SEGUNDA_MS) / MS_POR_DIA);
  const n = Math.floor(diffDias / 7);
  const diaSemana = ((diffDias % 7) + 7) % 7;
  const segundaISO = somarDias(dataISO, -diaSemana);
  const domingoISO = somarDias(segundaISO, 6);
  const diasDaSemana = Array.from({ length: 7 }, (_, idx) => somarDias(segundaISO, idx));
  const nPar = ((n % 2) + 2) % 2 === 0;

  return {
    dataISO,
    n,
    numeroSemana: n + 1,
    diaSemana,
    segundaISO,
    domingoISO,
    diasDaSemana,
    nPar,
  };
}

export function obterFuncionarioMeta(funcionarioId) {
  const meta = FUNCIONARIOS_LISTA.find((f) => f.id === funcionarioId);
  if (!meta) {
    throw new Error(`Funcionário desconhecido: ${funcionarioId}`);
  }
  return meta;
}

export function obterEscalaDaSemana(data, funcionarioId) {
  const { nPar } = obterInfoSemana(data);
  const meta = obterFuncionarioMeta(funcionarioId);
  if (nPar) {
    return meta.papel === 'funcionario1' ? 'A' : 'B';
  }
  return meta.papel === 'funcionario1' ? 'B' : 'A';
}

function trabalhaPelaRegraBase(escalaSemana, diaSemana) {
  if (diaSemana === 6) return false; // Domingo sempre fechado
  if (escalaSemana === 'A') return diaSemana >= 0 && diaSemana <= 4; // Seg a Sex
  return diaSemana >= 1 && diaSemana <= 5; // Ter a Sáb
}

function horarioBase(funcionarioId, diaSemana, trabalhaSozinhoVendedor = false) {
  const meta = obterFuncionarioMeta(funcionarioId);
  if (meta.equipe === 'Administrativo') {
    return {
      inicio: '08:30',
      fim: '17:54',
      texto: '08:30 às 17:54',
      minutos: 504, // 8h24
    };
  }

  // Vendedores
  if (diaSemana === 0 || diaSemana === 5 || trabalhaSozinhoVendedor) {
    return {
      inicio: '08:30',
      fim: '19:30',
      texto: '08:30 às 19:30',
      minutos: 600, // 10h
    };
  }

  if (meta.id === 'vendedor1') {
    return {
      inicio: '08:30',
      fim: '17:30',
      texto: '08:30 às 17:30',
      minutos: 480, // 8h
    };
  }

  return {
    inicio: '10:30',
    fim: '19:30',
    texto: '10:30 às 19:30',
    minutos: 480, // 8h
  };
}

/**
 * Função auxiliar pura: devolve o turno que a pessoa teria pela regra base no dia,
 * ignorando quaisquer exceções.
 */
export function calcularTurnoBase(data, funcionarioId) {
  const dataISO = paraDataISO(data);
  const { diaSemana } = obterInfoSemana(dataISO);
  const meta = obterFuncionarioMeta(funcionarioId);
  const escalaSemana = obterEscalaDaSemana(dataISO, funcionarioId);
  const antesDoInicio = dataISO < DATA_INICIO_NOVA_ESCALA;
  const trabalha = !antesDoInicio && trabalhaPelaRegraBase(escalaSemana, diaSemana);

  return {
    data: dataISO,
    funcionarioId,
    equipe: meta.equipe,
    escalaSemana,
    diaSemana,
    antesDoInicio,
    trabalha,
    horario: trabalha ? horarioBase(funcionarioId, diaSemana, diaSemana === 0 || diaSemana === 5) : null,
  };
}

export function formatarMinutosEmHoras(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${pad2(m)}`;
}

function encontrarExcecoesDoDia(dataISO, funcionarioId, excecoes) {
  if (!Array.isArray(excecoes) || excecoes.length === 0) {
    return {
      lojaFechada: null,
      ferias: null,
      ausencia: null,
      trocaFolga: null,
    };
  }

  let lojaFechada = null;
  let ferias = null;
  let ausencia = null;
  let trocaFolga = null;

  for (const exc of excecoes) {
    if (!exc || !exc.dataInicio || !exc.dataFim) continue;
    if (dataISO < exc.dataInicio || dataISO > exc.dataFim) continue;

    if (exc.tipo === 'loja_fechada') {
      lojaFechada = exc;
    } else if (exc.funcionarioId === funcionarioId) {
      if (exc.tipo === 'ferias') {
        ferias = exc;
      } else if (exc.tipo === 'ausencia') {
        ausencia = exc;
      } else if (exc.tipo === 'troca_folga') {
        trocaFolga = exc;
      }
    }
  }

  return { lojaFechada, ferias, ausencia, trocaFolga };
}

/**
 * Avalia se um vendedor trabalha no dia (sem entrar em recursão para horário).
 */
function vendedorEstaTrabalhandoNoDia(dataISO, vendedorId, excecoes) {
  const { diaSemana } = obterInfoSemana(dataISO);
  const { lojaFechada, ferias, ausencia, trocaFolga } = encontrarExcecoesDoDia(
    dataISO,
    vendedorId,
    excecoes
  );
  if (ferias || lojaFechada || diaSemana === 6 || ausencia) return false;
  if (dataISO < DATA_INICIO_NOVA_ESCALA) {
    return trocaFolga ? trocaFolga.novoEstado === 'trabalha' : false;
  }
  if (trocaFolga) {
    return trocaFolga.novoEstado === 'trabalha';
  }
  const escala = obterEscalaDaSemana(dataISO, vendedorId);
  return trabalhaPelaRegraBase(escala, diaSemana);
}

/**
 * Calcula a data de retorno das férias: primeiro dia de trabalho após dataFim
 * pela regra da escala (considerando loja fechada, troca de folga e ausências).
 */
export function calcularDataRetornoFerias(dataFimISO, funcionarioId, excecoes = []) {
  if (!dataFimISO) return null;
  const inicioBusca = somarDias(dataFimISO, 1);

  for (let offset = 0; offset < 90; offset++) {
    const candidato = somarDias(inicioBusca, offset);
    if (candidato < DATA_INICIO_NOVA_ESCALA) {
      continue;
    }
    const { diaSemana } = obterInfoSemana(candidato);
    const { lojaFechada, ferias, ausencia, trocaFolga } = encontrarExcecoesDoDia(
      candidato,
      funcionarioId,
      excecoes
    );
    if (lojaFechada || diaSemana === 6) continue;
    if (ferias || ausencia) continue;
    if (trocaFolga) {
      if (trocaFolga.novoEstado === 'trabalha') return candidato;
      continue;
    }
    const escala = obterEscalaDaSemana(candidato, funcionarioId);
    if (trabalhaPelaRegraBase(escala, diaSemana)) {
      return candidato;
    }
  }

  return null;
}

/**
 * Função pura principal: recebe data e funcionário (e lista opcional de exceções)
 * e devolve se trabalha ou folga, status, rótulo e horário.
 */
export function calcularEscalaDia(data, funcionarioId, excecoes = []) {
  const dataISO = paraDataISO(data);
  const infoSemana = obterInfoSemana(dataISO);
  const { diaSemana, numeroSemana } = infoSemana;
  const meta = obterFuncionarioMeta(funcionarioId);
  const escalaSemana = obterEscalaDaSemana(dataISO, funcionarioId);
  const antesDoInicio = dataISO < DATA_INICIO_NOVA_ESCALA;

  const { lojaFechada, ferias, ausencia, trocaFolga } = encontrarExcecoesDoDia(
    dataISO,
    funcionarioId,
    excecoes
  );

  // 1. Precedência máxima do funcionário: Férias (sobrepõe troca_folga e escala base)
  if (ferias) {
    const dataRetorno = calcularDataRetornoFerias(ferias.dataFim, funcionarioId, excecoes);
    return {
      data: dataISO,
      funcionarioId,
      equipe: meta.equipe,
      escalaSemana,
      numeroSemana,
      diaSemana,
      antesDoInicio,
      trabalha: false,
      status: 'ferias',
      rotulo: 'Férias',
      horario: null,
      minutosTrabalhados: 0,
      alterado: true,
      motivoAlteracao: ferias.motivo || 'Férias programadas',
      tipoExcecao: 'ferias',
      quemCobre: ferias.quemCobre || '',
      dataRetorno,
      excecaoId: ferias.id || null,
    };
  }

  // 2. Loja fechada (feriado) ou Domingo
  if (lojaFechada || diaSemana === 6) {
    return {
      data: dataISO,
      funcionarioId,
      equipe: meta.equipe,
      escalaSemana,
      numeroSemana,
      diaSemana,
      antesDoInicio,
      trabalha: false,
      status: 'folga',
      rotulo: 'Folga',
      horario: null,
      minutosTrabalhados: 0,
      alterado: Boolean(lojaFechada),
      motivoAlteracao: lojaFechada ? lojaFechada.motivo || 'Loja fechada' : '',
      tipoExcecao: lojaFechada ? 'loja_fechada' : null,
      quemCobre: '',
      dataRetorno: null,
      excecaoId: lojaFechada?.id || null,
    };
  }

  // 3. Ausência comum
  if (ausencia) {
    return {
      data: dataISO,
      funcionarioId,
      equipe: meta.equipe,
      escalaSemana,
      numeroSemana,
      diaSemana,
      antesDoInicio,
      trabalha: false,
      status: 'ausencia',
      rotulo: 'Ausência',
      horario: null,
      minutosTrabalhados: 0,
      alterado: true,
      motivoAlteracao: ausencia.motivo || 'Ausência registrada',
      tipoExcecao: 'ausencia',
      quemCobre: '',
      dataRetorno: null,
      excecaoId: ausencia.id || null,
    };
  }

  // 4. Antes do início da nova escala (15/12/2026)
  if (antesDoInicio && !trocaFolga) {
    return {
      data: dataISO,
      funcionarioId,
      equipe: meta.equipe,
      escalaSemana,
      numeroSemana,
      diaSemana,
      antesDoInicio: true,
      trabalha: false,
      status: 'regime_antigo',
      rotulo: 'Regime anterior',
      horario: null,
      minutosTrabalhados: 0,
      alterado: false,
      motivoAlteracao: '',
      tipoExcecao: null,
      quemCobre: '',
      dataRetorno: null,
      excecaoId: null,
    };
  }

  // 5. Troca de folga
  if (trocaFolga) {
    if (trocaFolga.novoEstado === 'folga') {
      return {
        data: dataISO,
        funcionarioId,
        equipe: meta.equipe,
        escalaSemana,
        numeroSemana,
        diaSemana,
        antesDoInicio,
        trabalha: false,
        status: 'folga',
        rotulo: 'Folga',
        horario: null,
        minutosTrabalhados: 0,
        alterado: true,
        motivoAlteracao: trocaFolga.motivo || 'Troca de folga',
        tipoExcecao: 'troca_folga',
        quemCobre: '',
        dataRetorno: null,
        excecaoId: trocaFolga.id || null,
      };
    }

    // novoEstado === 'trabalha'
    let trabalhaSozinho = false;
    if (meta.equipe === 'Vendedores' && (diaSemana === 0 || diaSemana === 5)) {
      const outroId = funcionarioId === 'vendedor1' ? 'vendedor2' : 'vendedor1';
      trabalhaSozinho = !vendedorEstaTrabalhandoNoDia(dataISO, outroId, excecoes);
    }
    const horario = horarioBase(funcionarioId, diaSemana, trabalhaSozinho);
    return {
      data: dataISO,
      funcionarioId,
      equipe: meta.equipe,
      escalaSemana,
      numeroSemana,
      diaSemana,
      antesDoInicio,
      trabalha: true,
      status: 'trabalha',
      rotulo: 'Trabalha',
      horario,
      minutosTrabalhados: horario.minutos,
      alterado: true,
      motivoAlteracao: trocaFolga.motivo || 'Troca de folga',
      tipoExcecao: 'troca_folga',
      quemCobre: '',
      dataRetorno: null,
      excecaoId: trocaFolga.id || null,
    };
  }

  // 6. Regra base de revezamento
  const trabalha = trabalhaPelaRegraBase(escalaSemana, diaSemana);
  if (!trabalha) {
    return {
      data: dataISO,
      funcionarioId,
      equipe: meta.equipe,
      escalaSemana,
      numeroSemana,
      diaSemana,
      antesDoInicio: false,
      trabalha: false,
      status: 'folga',
      rotulo: 'Folga',
      horario: null,
      minutosTrabalhados: 0,
      alterado: false,
      motivoAlteracao: '',
      tipoExcecao: null,
      quemCobre: '',
      dataRetorno: null,
      excecaoId: null,
    };
  }

  const horario = horarioBase(funcionarioId, diaSemana, diaSemana === 0 || diaSemana === 5);
  return {
    data: dataISO,
    funcionarioId,
    equipe: meta.equipe,
    escalaSemana,
    numeroSemana,
    diaSemana,
    antesDoInicio: false,
    trabalha: true,
    status: 'trabalha',
    rotulo: 'Trabalha',
    horario,
    minutosTrabalhados: horario.minutos,
    alterado: false,
    motivoAlteracao: '',
    tipoExcecao: null,
    quemCobre: '',
    dataRetorno: null,
    excecaoId: null,
  };
}

/**
 * Consolida a visão completa de um dia para a tela Hoje.
 */
export function analisarDiaLoja(data, excecoes = [], nomes = NOMES_PADRAO) {
  const dataISO = paraDataISO(data);
  const { diaSemana, numeroSemana } = obterInfoSemana(dataISO);
  const antesDoInicio = dataISO < DATA_INICIO_NOVA_ESCALA;

  const excLoja = Array.isArray(excecoes)
    ? excecoes.find(
        (e) => e && e.tipo === 'loja_fechada' && dataISO >= e.dataInicio && dataISO <= e.dataFim
      )
    : null;

  const lojaFechada = diaSemana === 6 || Boolean(excLoja);
  const motivoLojaFechada = excLoja
    ? excLoja.motivo || 'Feriado / Loja fechada'
    : diaSemana === 6
      ? 'Domingo — loja fechada'
      : '';

  const registros = FUNCIONARIOS_LISTA.map((meta) => {
    const calc = calcularEscalaDia(dataISO, meta.id, excecoes);
    return {
      ...calc,
      nome: (nomes && nomes[meta.id]) || meta.nomePadrao,
      turno: meta.turno,
    };
  });

  const vendedores = registros.filter((r) => r.equipe === 'Vendedores');
  const administrativo = registros.filter((r) => r.equipe === 'Administrativo');
  const trabalhando = registros.filter((r) => r.trabalha);
  const naoTrabalhando = registros.filter((r) => !r.trabalha);

  const vendedoresTrabalhando = vendedores.filter((r) => r.trabalha);
  const vendedoresAusentes = vendedores.filter((r) => !r.trabalha);
  const adminTrabalhando = administrativo.filter((r) => r.trabalha);

  let alertaVendedor = null;
  if (!lojaFechada && !antesDoInicio) {
    if (vendedoresTrabalhando.length === 0) {
      const feriasComCobertura = vendedoresAusentes.find((v) => v.quemCobre);
      alertaVendedor = {
        tipo: 'sem_vendedor',
        titulo: 'Nenhum vendedor escalado',
        mensagem: feriasComCobertura
          ? `Nenhum vendedor da equipe trabalha hoje (coberto por ${feriasComCobertura.quemCobre}).`
          : 'Nenhum vendedor trabalhando neste dia (loja descoberta de 08:30 às 19:30).',
        horarioDescoberto: '08:30 às 19:30',
        cobertura: feriasComCobertura ? feriasComCobertura.quemCobre : '',
      };
    } else if (vendedoresTrabalhando.length === 1) {
      const unico = vendedoresTrabalhando[0];
      const ausente = vendedoresAusentes[0];
      const diaDeDoisVendedores = diaSemana >= 1 && diaSemana <= 4; // Ter a Sex

      if (diaDeDoisVendedores) {
        const horarioDescoberto =
          unico.funcionarioId === 'vendedor1' ? '17:30 às 19:30' : '08:30 às 10:30';
        const coberturaTexto = ausente?.quemCobre ? ` · coberto por ${ausente.quemCobre}` : '';
        const detalheSozinho =
          unico.horario?.fim === '19:30' && adminTrabalhando.length > 0
            ? ' Após a saída do administrativo às 17:54, fica sozinho na loja.'
            : '';

        alertaVendedor = {
          tipo: 'vendedor_unico_dia_duplo',
          titulo: 'Apenas 1 vendedor hoje',
          mensagem: `${unico.nome} trabalha sozinho nos vendedores (${unico.horario?.texto}). Horário descoberto: ${horarioDescoberto}${coberturaTexto}.${detalheSozinho}`,
          horarioDescoberto,
          cobertura: ausente?.quemCobre || '',
        };
      } else {
        // Segunda ou Sábado: naturalmente só há 1 vendedor
        const coberturaTexto = ausente?.quemCobre ? ` (${ausente.rotulo}: coberto por ${ausente.quemCobre})` : '';
        alertaVendedor = {
          tipo: 'vendedor_unico_padrao',
          titulo: 'Vendedor único na loja',
          mensagem: `${unico.nome} abre e fecha a loja (${unico.horario?.texto}). Fica sozinho na loja após as 17:54 (saída do administrativo)${coberturaTexto}.`,
          horarioDescoberto: '',
          cobertura: ausente?.quemCobre || '',
        };
      }
    }
  }

  return {
    data: dataISO,
    dataBR: formatarDataBR(dataISO),
    diaSemana,
    diaSemanaLabel: DIAS_SEMANA_COMPLETOS[diaSemana],
    numeroSemana,
    antesDoInicio,
    lojaFechada,
    lojaAlterada: Boolean(excLoja),
    motivoLojaFechada,
    vendedores,
    administrativo,
    trabalhando,
    naoTrabalhando,
    alertaVendedor,
  };
}

/**
 * Verifica se existe alguma exceção de férias para o funcionário na data informada.
 */
export function verificarTrocaDentroDeFerias(funcionarioId, dataStr, excecoes = []) {
  if (!funcionarioId || !dataStr || !Array.isArray(excecoes)) return null;
  const dataISO = paraDataISO(dataStr);
  return (
    excecoes.find(
      (exc) =>
        exc &&
        exc.tipo === 'ferias' &&
        exc.funcionarioId === funcionarioId &&
        dataISO >= exc.dataInicio &&
        dataISO <= exc.dataFim
    ) || null
  );
}

/**
 * Gera alertas gerenciais sem bloquear operações:
 * - Férias sobrepostas na mesma equipe
 * - Dia sem nenhum vendedor trabalhando
 * - Dia com 1 vendedor só em dia que normalmente tem dois (Ter-Sex), com horário descoberto e "coberto por [nome]"
 * - Mais de 42h na semana
 * - Mais de 5 dias seguidos de trabalho
 */
export function gerarAlertasGerente(excecoes = [], nomes = NOMES_PADRAO) {
  const alertas = [];
  const feriasList = (excecoes || []).filter((e) => e && e.tipo === 'ferias');

  // 1. Férias sobrepostas na mesma equipe
  for (let i = 0; i < feriasList.length; i++) {
    for (let j = i + 1; j < feriasList.length; j++) {
      const a = feriasList[i];
      const b = feriasList[j];
      if (!a.funcionarioId || !b.funcionarioId) continue;
      if (a.funcionarioId === b.funcionarioId) continue;
      const metaA = obterFuncionarioMeta(a.funcionarioId);
      const metaB = obterFuncionarioMeta(b.funcionarioId);
      if (metaA.equipe !== metaB.equipe) continue;

      if (a.dataInicio <= b.dataFim && b.dataInicio <= a.dataFim) {
        const inicioSobre = a.dataInicio > b.dataInicio ? a.dataInicio : b.dataInicio;
        const fimSobre = a.dataFim < b.dataFim ? a.dataFim : b.dataFim;
        const nomeA = nomes[a.funcionarioId] || metaA.nomePadrao;
        const nomeB = nomes[b.funcionarioId] || metaB.nomePadrao;
        alertas.push({
          id: `ferias-sobrepostas-${a.id || i}-${b.id || j}`,
          tipo: 'ferias_sobrepostas',
          titulo: `Férias sobrepostas em ${metaA.equipe}`,
          mensagem: `${nomeA} e ${nomeB} têm férias sobrepostas de ${formatarDataBR(inicioSobre)} a ${formatarDataBR(fimSobre)}.`,
          data: inicioSobre,
        });
      }
    }
  }

  // Define janela de análise a partir de 15/12/2026 até a maior data das exceções + 14 dias (mínimo 90 dias)
  let fimAnalise = somarDias(DATA_INICIO_NOVA_ESCALA, 90);
  for (const exc of excecoes || []) {
    if (exc?.dataFim) {
      const candidato = somarDias(exc.dataFim, 14);
      if (candidato > fimAnalise) fimAnalise = candidato;
    }
  }

  // Limite de segurança de 240 dias
  const maxDias = Math.min(
    240,
    Math.round((paraUTCMs(fimAnalise) - paraUTCMs(DATA_INICIO_NOVA_ESCALA)) / MS_POR_DIA) + 1
  );

  // Rastreia dias seguidos e horas por semana por funcionário
  const streakPorFunc = { vendedor1: 0, vendedor2: 0, admin1: 0, admin2: 0 };
  const alerta5DiasEmitido = new Set();
  const minutosSemanaMap = new Map(); // `${segundaISO}|${funcId}` -> minutos

  for (let offset = 0; offset < maxDias; offset++) {
    const dataISO = somarDias(DATA_INICIO_NOVA_ESCALA, offset);
    const { diaSemana, segundaISO } = obterInfoSemana(dataISO);
    const analise = analisarDiaLoja(dataISO, excecoes, nomes);

    // 2. Dia sem nenhum vendedor / 3. Dia com 1 vendedor em dia que normalmente tem dois (Ter-Sex)
    if (!analise.lojaFechada) {
      const vendedoresTrab = analise.vendedores.filter((v) => v.trabalha);
      if (vendedoresTrab.length === 0) {
        const comCobertura = analise.vendedores.find((v) => v.quemCobre);
        alertas.push({
          id: `sem-vendedor-${dataISO}`,
          tipo: 'sem_vendedor',
          titulo: `Dia sem vendedor · ${formatarDataBR(dataISO)}`,
          mensagem: comCobertura
            ? `Nenhum vendedor escalado em ${formatarDataBR(dataISO)} (${DIAS_SEMANA_CURTOS[diaSemana]}) · coberto por ${comCobertura.quemCobre}.`
            : `Nenhum vendedor trabalhando em ${formatarDataBR(dataISO)} (${DIAS_SEMANA_CURTOS[diaSemana]}).`,
          data: dataISO,
        });
      } else if (vendedoresTrab.length === 1 && diaSemana >= 1 && diaSemana <= 4) {
        const unico = vendedoresTrab[0];
        const ausente = analise.vendedores.find((v) => !v.trabalha);
        const horarioDescoberto =
          unico.funcionarioId === 'vendedor1' ? '17:30 às 19:30' : '08:30 às 10:30';
        const coberturaStr = ausente?.quemCobre ? ` · coberto por ${ausente.quemCobre}` : '';
        alertas.push({
          id: `um-vendedor-${dataISO}`,
          tipo: 'vendedor_unico_dia_duplo',
          titulo: `1 vendedor em dia de dois · ${formatarDataBR(dataISO)}`,
          mensagem: `${unico.nome} sozinho (${DIAS_SEMANA_CURTOS[diaSemana]}). Horário descoberto: ${horarioDescoberto}${coberturaStr}.`,
          data: dataISO,
        });
      }
    }

    // 4 & 5. Horas semanais > 42h e dias seguidos > 5
    for (const meta of FUNCIONARIOS_LISTA) {
      const calc = calcularEscalaDia(dataISO, meta.id, excecoes);
      const nome = nomes[meta.id] || meta.nomePadrao;
      if (calc.trabalha) {
        streakPorFunc[meta.id] += 1;
        if (streakPorFunc[meta.id] > 5) {
          const chaveStreak = `${meta.id}|${segundaISO}`;
          if (!alerta5DiasEmitido.has(chaveStreak)) {
            alerta5DiasEmitido.add(chaveStreak);
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
      const meta = obterFuncionarioMeta(funcId);
      const nome = nomes[funcId] || meta.nomePadrao;
      alertas.push({
        id: `acima-42h-${funcId}-${segundaISO}`,
        tipo: 'acima_42h',
        titulo: `Acima de 42h na semana · ${nome}`,
        mensagem: `${nome} soma ${formatarMinutosEmHoras(minutos)} na semana de ${formatarDataBR(segundaISO)}.`,
        data: segundaISO,
      });
    }
  }

  return alertas;
}

/**
 * Executa os 5 casos de teste da Seção 8 com datas fixas,
 * sem considerar as exceções da Seção 7 e sem depender da data do aparelho.
 */
export function executarTestesSecao8() {
  const resultados = [];

  // Caso 1: Terça 15/12/2026
  {
    const data = '2026-12-15';
    const t = calcularEscalaDia(data, 'vendedor1', []);
    const l = calcularEscalaDia(data, 'vendedor2', []);
    const m1 = calcularEscalaDia(data, 'admin1', []);
    const m2 = calcularEscalaDia(data, 'admin2', []);
    const ok =
      t.trabalha &&
      t.horario?.texto === '08:30 às 17:30' &&
      l.trabalha &&
      l.horario?.texto === '10:30 às 19:30' &&
      m1.trabalha &&
      m1.horario?.texto === '08:30 às 17:54' &&
      m2.trabalha &&
      m2.horario?.texto === '08:30 às 17:54';

    resultados.push({
      id: 'caso-1',
      titulo: 'Terça 15/12/2026 — Início da nova escala',
      esperado:
        'Thiago 08:30 às 17:30 · Lucas 10:30 às 19:30 · Murillo e Maria 08:30 às 17:54',
      obtido: `Thiago ${t.trabalha ? t.horario?.texto : t.rotulo} · Lucas ${l.trabalha ? l.horario?.texto : l.rotulo} · Murillo ${m1.trabalha ? m1.horario?.texto : m1.rotulo} · Maria ${m2.trabalha ? m2.horario?.texto : m2.rotulo}`,
      ok,
    });
  }

  // Caso 2: Sábado 19/12/2026
  {
    const data = '2026-12-19';
    const t = calcularEscalaDia(data, 'vendedor1', []);
    const l = calcularEscalaDia(data, 'vendedor2', []);
    const m1 = calcularEscalaDia(data, 'admin1', []);
    const m2 = calcularEscalaDia(data, 'admin2', []);
    const ok =
      !t.trabalha &&
      t.rotulo === 'Folga' &&
      l.trabalha &&
      l.horario?.texto === '08:30 às 19:30' &&
      !m1.trabalha &&
      m1.rotulo === 'Folga' &&
      m2.trabalha &&
      m2.horario?.texto === '08:30 às 17:54';

    resultados.push({
      id: 'caso-2',
      titulo: 'Sábado 19/12/2026 — Semana 1 (Lucas e Maria trabalham)',
      esperado:
        'Lucas 08:30 às 19:30 (sozinho nos vendedores) · Thiago folga · Maria 08:30 às 17:54 · Murillo folga',
      obtido: `Lucas ${l.trabalha ? l.horario?.texto : l.rotulo} · Thiago ${t.rotulo} · Maria ${m2.trabalha ? m2.horario?.texto : m2.rotulo} · Murillo ${m1.rotulo}`,
      ok,
    });
  }

  // Caso 3: Segunda 21/12/2026
  {
    const data = '2026-12-21';
    const t = calcularEscalaDia(data, 'vendedor1', []);
    const l = calcularEscalaDia(data, 'vendedor2', []);
    const m1 = calcularEscalaDia(data, 'admin1', []);
    const m2 = calcularEscalaDia(data, 'admin2', []);
    const ok =
      !t.trabalha &&
      t.rotulo === 'Folga' &&
      l.trabalha &&
      l.horario?.texto === '08:30 às 19:30' &&
      !m1.trabalha &&
      m1.rotulo === 'Folga' &&
      m2.trabalha &&
      m2.horario?.texto === '08:30 às 17:54';

    resultados.push({
      id: 'caso-3',
      titulo: 'Segunda 21/12/2026 — Semana 2 (troca para B/A)',
      esperado:
        'Lucas 08:30 às 19:30 (sozinho nos vendedores) · Thiago folga · Maria trabalha · Murillo folga',
      obtido: `Lucas ${l.trabalha ? l.horario?.texto : l.rotulo} · Thiago ${t.rotulo} · Maria ${m2.trabalha ? m2.horario?.texto : m2.rotulo} · Murillo ${m1.rotulo}`,
      ok,
    });
  }

  // Caso 4: Domingo 20/12/2026
  {
    const data = '2026-12-20';
    const dia = analisarDiaLoja(data, []);
    const todosFolgando = dia.vendedores.every((v) => !v.trabalha) && dia.administrativo.every((a) => !a.trabalha);
    const ok = dia.lojaFechada && todosFolgando;

    resultados.push({
      id: 'caso-4',
      titulo: 'Domingo 20/12/2026 — Loja fechada',
      esperado: 'Todos folgam e a loja está fechada',
      obtido: `${dia.lojaFechada ? 'Loja fechada' : 'Loja aberta'} · Trabalhando: ${dia.trabalhando.length}`,
      ok,
    });
  }

  // Caso 5: Cada pessoa trabalha 5 dias por semana e soma 42h (testando Semana 2 [n=1] e Semana 3 [n=2])
  {
    const semanasTeste = [
      { label: 'Sem. 2 (21/12 a 27/12)', segunda: '2026-12-21' },
      { label: 'Sem. 3 (28/12 a 03/01)', segunda: '2026-12-28' },
    ];
    let ok = true;
    const detalhes = [];

    for (const sem of semanasTeste) {
      const { diasDaSemana } = obterInfoSemana(sem.segunda);
      for (const func of FUNCIONARIOS_LISTA) {
        let diasTrab = 0;
        let minutos = 0;
        for (const d of diasDaSemana) {
          const r = calcularEscalaDia(d, func.id, []);
          if (r.trabalha) {
            diasTrab += 1;
            minutos += r.minutosTrabalhados;
          }
        }
        if (diasTrab !== 5 || minutos !== 2520) {
          ok = false;
        }
        detalhes.push(`${func.nomePadrao} (${sem.label}): ${diasTrab}d / ${formatarMinutosEmHoras(minutos)}`);
      }
    }

    resultados.push({
      id: 'caso-5',
      titulo: 'Carga semanal — 5 dias trabalhados e 42h por pessoa',
      esperado: 'Todos com 5 dias e 42h nas semanas completas (escalas A e B)',
      obtido: detalhes.join(' | '),
      ok,
    });
  }

  return {
    total: resultados.length,
    aprovados: resultados.filter((r) => r.ok).length,
    resultados,
  };
}
