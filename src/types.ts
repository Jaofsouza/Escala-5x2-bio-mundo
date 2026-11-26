export type FuncionarioId = 'vendedor1' | 'vendedor2' | 'admin1' | 'admin2';
export type PessoaId = FuncionarioId | 'gerente1';

export type EquipeNome = 'Vendedores' | 'Administrativo';

export type TipoExcecao = 'ferias' | 'ausencia' | 'troca_folga' | 'loja_fechada' | 'cobertura';

export type NovoEstadoTroca = 'trabalha' | 'folga' | '';

export type ModoCobertura = 'turno_completo' | 'faixa' | '';

export interface NomesEquipe {
  vendedor1: string;
  vendedor2: string;
  admin1: string;
  admin2: string;
  gerente1: string;
}

export interface EquipeConfigDoc extends NomesEquipe {
  secao7Inicializada: boolean;
  coberturaInicializada: boolean;
  atualizadoEm: string;
}

export interface Excecao {
  id: string;
  tipo: TipoExcecao;
  funcionarioId: PessoaId | '';
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  novoEstado: NovoEstadoTroca;
  quemCobre: string;
  coberturaPorId?: PessoaId | '';
  cobreFuncionarioId?: FuncionarioId | '';
  modo?: ModoCobertura;
  horaInicio?: string;
  horaFim?: string;
  origemFeriasId?: string;
  motivo: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface HistoricoItem {
  id: string;
  acao: 'criacao' | 'edicao' | 'remocao';
  categoria: 'ferias' | 'ausencia' | 'troca_folga' | 'loja_fechada' | 'equipe' | 'cobertura';
  afetado: string;
  periodo: string;
  motivo: string;
  detalhes: string;
  criadoEm: string;
}

export interface HorarioTurno {
  inicio: string;
  fim: string;
  texto: string;
  minutos: number;
}

export interface ResultadoTurnoBase {
  data: string;
  funcionarioId: FuncionarioId;
  equipe: EquipeNome;
  escalaSemana: 'A' | 'B';
  diaSemana: number;
  antesDoInicio: boolean;
  trabalha: boolean;
  horario: HorarioTurno | null;
}

export interface ResultadoEscalaDia {
  data: string;
  funcionarioId: FuncionarioId;
  equipe: EquipeNome;
  escalaSemana: 'A' | 'B';
  numeroSemana: number;
  diaSemana: number;
  antesDoInicio: boolean;
  trabalha: boolean;
  status: 'trabalha' | 'folga' | 'ferias' | 'ausencia' | 'loja_fechada' | 'regime_antigo';
  rotulo: string;
  horario: HorarioTurno | null;
  minutosTrabalhados: number;
  alterado: boolean;
  motivoAlteracao: string;
  tipoExcecao: TipoExcecao | null;
  quemCobre: string;
  dataRetorno: string | null;
  excecaoId: string | null;
}

export interface RegistroDiaFuncionario extends ResultadoEscalaDia {
  nome: string;
  turno: string;
}

export interface AlertaVendedorDia {
  tipo: 'sem_vendedor' | 'vendedor_unico_dia_duplo' | 'vendedor_unico_padrao';
  titulo: string;
  mensagem: string;
  horarioDescoberto: string;
  cobertura: string;
}

export interface AnaliseDiaLoja {
  data: string;
  dataBR: string;
  diaSemana: number;
  diaSemanaLabel: string;
  numeroSemana: number;
  antesDoInicio: boolean;
  lojaFechada: boolean;
  lojaAlterada: boolean;
  motivoLojaFechada: string;
  vendedores: RegistroDiaFuncionario[];
  administrativo: RegistroDiaFuncionario[];
  trabalhando: RegistroDiaFuncionario[];
  naoTrabalhando: RegistroDiaFuncionario[];
  alertaVendedor: AlertaVendedorDia | null;
}

export interface AlertaGerente {
  id: string;
  tipo:
    | 'ferias_sobrepostas'
    | 'sem_vendedor'
    | 'vendedor_unico_dia_duplo'
    | 'mais_de_5_dias'
    | 'acima_42h';
  titulo: string;
  mensagem: string;
  data: string;
}

export interface CoberturaAtivaDia {
  excecaoId: string;
  coberturaPorId: PessoaId;
  coberturaPorNome: string;
  cobreFuncionarioId: FuncionarioId;
  cobreFuncionarioNome: string;
  inicio: string;
  fim: string;
  texto: string;
  minutos: number;
  modo: 'turno_completo' | 'faixa';
  motivo: string;
  origemFeriasId: string;
  alterado: boolean;
}

export interface IntervaloDescoberto {
  inicio: string;
  fim: string;
  texto: string;
  cobreFuncionarioSugeridoId: FuncionarioId;
}

export interface AnaliseCoberturaDia {
  data: string;
  lojaFechada: boolean;
  antesDoInicio: boolean;
  coberturas: CoberturaAtivaDia[];
  coberturasGerencia: CoberturaAtivaDia[];
  intervalosDescobertos: IntervaloDescoberto[];
  totalmenteCoberto: boolean;
  parcialmenteCoberto: boolean;
  diaSemVendedorENemCobertura: boolean;
  coberturaSobrepostaGerente: boolean;
  resumoNeutralCobertura: string | null;
  alertaAmbarCobertura: {
    tipo: 'sem_vendedor' | 'parcialmente_coberto' | 'descoberto' | 'vendedor_unico_padrao';
    titulo: string;
    mensagem: string;
    intervalosParaCobrir: IntervaloDescoberto[];
  } | null;
}

export interface AlertaCoberturaGerente {
  id: string;
  tipo:
    | 'sem_vendedor'
    | 'horario_descoberto'
    | 'cobertura_sobreposta'
    | 'cobertura_mais_de_5_dias'
    | 'ferias_sobrepostas'
    | 'mais_de_5_dias'
    | 'acima_42h';
  titulo: string;
  mensagem: string;
  data: string;
  intervalo?: IntervaloDescoberto;
}

export interface ResultadoTesteSecao8 {
  id: string;
  titulo: string;
  esperado: string;
  obtido: string;
  ok: boolean;
}

export interface ResumoTestesSecao8 {
  total: number;
  aprovados: number;
  resultados: ResultadoTesteSecao8[];
}
