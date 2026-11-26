import type {
  AlertaCoberturaGerente,
  AnaliseCoberturaDia,
  CoberturaAtivaDia,
  Excecao,
  NomesEquipe,
  PessoaId,
  ResumoTestesSecao8,
} from './types';

export const GERENTE_META: {
  id: 'gerente1';
  nomePadrao: string;
  equipe: 'Gerência';
};

export const NOMES_PADRAO_COMPLETOS: NomesEquipe;
export const EXCECOES_PRE_CADASTRADAS_TESTE: Array<Partial<Excecao>>;

export function paraMinutos(hhmm: string): number;
export function minutosParaHHMM(totalMin: number): string;
export function resolverNomePessoa(pessoaId: PessoaId | '', nomes?: Partial<NomesEquipe>): string;
export function subtrairIntervalos(
  baseIni: number,
  baseFim: number,
  intervalosCobertos: Array<[number, number]>
): Array<[number, number]>;
export function obterCoberturasDoDia(
  data: string,
  excecoes?: Excecao[],
  nomes?: Partial<NomesEquipe>
): CoberturaAtivaDia[];
export function analisarCoberturaDia(
  data: string,
  excecoes?: Excecao[],
  nomes?: Partial<NomesEquipe>
): AnaliseCoberturaDia;
export function calcularResumoCoberturaSemana(
  dataQualquerDaSemana: string,
  pessoaId?: PessoaId,
  excecoes?: Excecao[],
  nomes?: Partial<NomesEquipe>
): { minutos: number; diasCobrindo: number };
export function detectarSequenciasLongasCobertura(
  excecoes?: Excecao[],
  pessoaId?: PessoaId,
  nomes?: Partial<NomesEquipe>
): AlertaCoberturaGerente[];
export function gerarAlertasGerenteComCobertura(
  excecoes?: Excecao[],
  nomes?: Partial<NomesEquipe>
): AlertaCoberturaGerente[];
export function executarTestesCobertura(): ResumoTestesSecao8;
