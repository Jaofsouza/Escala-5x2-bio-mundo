import type {
  AnaliseDiaLoja,
  AlertaGerente,
  Excecao,
  FuncionarioId,
  NomesEquipe,
  ResultadoEscalaDia,
  ResultadoTurnoBase,
  ResumoTestesSecao8,
} from './types';

export const DATA_BASE_SEMANA_0: string;
export const DATA_INICIO_NOVA_ESCALA: string;

export const FUNCIONARIOS_LISTA: Array<{
  id: FuncionarioId;
  nomePadrao: string;
  equipe: 'Vendedores' | 'Administrativo';
  papel: 'funcionario1' | 'funcionario2';
  turno: string;
}>;

export const NOMES_PADRAO: {
  vendedor1: string;
  vendedor2: string;
  admin1: string;
  admin2: string;
};
export const DIAS_SEMANA_COMPLETOS: string[];
export const DIAS_SEMANA_CURTOS: string[];
export const MESES_PT: string[];

export function parseDataCalendario(data: string | { ano: number; mes: number; dia: number }): {
  ano: number;
  mes: number;
  dia: number;
};
export function paraDataISO(data: string | { ano: number; mes: number; dia: number }): string;
export function formatarDataBR(data: string | { ano: number; mes: number; dia: number }): string;
export function formatarDiaMesBR(data: string | { ano: number; mes: number; dia: number }): string;
export function somarDias(data: string, deltaDias: number): string;
export function diasNoMes(ano: number, mes: number): number;
export function obterHojeSaoPaulo(): string;
export function obterInfoSemana(data: string): {
  dataISO: string;
  n: number;
  numeroSemana: number;
  diaSemana: number;
  segundaISO: string;
  domingoISO: string;
  diasDaSemana: string[];
  nPar: boolean;
};
export function obterFuncionarioMeta(funcionarioId: FuncionarioId): {
  id: FuncionarioId;
  nomePadrao: string;
  equipe: 'Vendedores' | 'Administrativo';
  papel: 'funcionario1' | 'funcionario2';
  turno: string;
};
export function obterEscalaDaSemana(data: string, funcionarioId: FuncionarioId): 'A' | 'B';
export function calcularTurnoBase(data: string, funcionarioId: FuncionarioId): ResultadoTurnoBase;
export function formatarMinutosEmHoras(minutos: number): string;
export function calcularDataRetornoFerias(
  dataFimISO: string,
  funcionarioId: FuncionarioId,
  excecoes?: Excecao[]
): string | null;
export function calcularEscalaDia(
  data: string,
  funcionarioId: FuncionarioId,
  excecoes?: Excecao[]
): ResultadoEscalaDia;
export function analisarDiaLoja(
  data: string,
  excecoes?: Excecao[],
  nomes?: Partial<NomesEquipe>
): AnaliseDiaLoja;
export function verificarTrocaDentroDeFerias(
  funcionarioId: FuncionarioId | '',
  dataStr: string,
  excecoes?: Excecao[]
): Excecao | null;
export function gerarAlertasGerente(
  excecoes?: Excecao[],
  nomes?: Partial<NomesEquipe>
): AlertaGerente[];
export function executarTestesSecao8(): ResumoTestesSecao8;
