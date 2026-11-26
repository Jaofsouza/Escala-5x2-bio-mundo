import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  calcularResumoCoberturaSemana,
  detectarSequenciasLongasCobertura,
  obterCoberturasDoDia,
} from '../cobertura.js';
import {
  calcularEscalaDia,
  DIAS_SEMANA_CURTOS,
  diasNoMes,
  formatarDiaMesBR,
  formatarMinutosEmHoras,
  FUNCIONARIOS_LISTA,
  MESES_PT,
  obterEscalaDaSemana,
  obterHojeSaoPaulo,
  obterInfoSemana,
  paraDataISO,
  parseDataCalendario,
} from '../escala.js';
import type { Excecao, FuncionarioId, NomesEquipe, PessoaId } from '../types';

const STORAGE_KEY_FUNCIONARIO = 'escala_loja_minha_escolha';

interface MinhaEscalaViewProps {
  excecoes: Excecao[];
  nomes: NomesEquipe;
}

function carregarEscolhaLocal(): PessoaId {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_FUNCIONARIO);
    if (
      salvo === 'vendedor1' ||
      salvo === 'vendedor2' ||
      salvo === 'admin1' ||
      salvo === 'admin2' ||
      salvo === 'gerente1'
    ) {
      return salvo;
    }
  } catch {
    // ignora falha de acesso ao storage
  }
  return 'vendedor1';
}

export function MinhaEscalaView({ excecoes, nomes }: MinhaEscalaViewProps) {
  const hojeReal = obterHojeSaoPaulo();
  const { ano: anoHoje, mes: mesHoje } = parseDataCalendario(hojeReal);

  const [pessoaId, setPessoaId] = useState<PessoaId>(carregarEscolhaLocal);
  const [ano, setAno] = useState<number>(() => (anoHoje === 2026 && mesHoje < 12 ? 2026 : anoHoje));
  const [mes, setMes] = useState<number>(() => (anoHoje === 2026 && mesHoje < 12 ? 12 : mesHoje));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FUNCIONARIO, pessoaId);
    } catch {
      // ignora falha de acesso ao storage
    }
  }, [pessoaId]);

  function mudarMes(delta: number) {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    } else if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    }
    setAno(novoAno);
    setMes(novoMes);
  }

  const ehGerencia = pessoaId === 'gerente1';
  const totalDias = diasNoMes(ano, mes);
  const primeiroDiaISO = paraDataISO({ ano, mes, dia: 1 });
  const offsetInicio = obterInfoSemana(primeiroDiaISO).diaSemana;

  const opcoesPessoas: Array<{ id: PessoaId; nome: string; equipe: string }> = [
    ...FUNCIONARIOS_LISTA.map((f) => ({
      id: f.id as PessoaId,
      nome: nomes[f.id] || f.nomePadrao,
      equipe: f.equipe,
    })),
    {
      id: 'gerente1',
      nome: nomes.gerente1,
      equipe: 'Gerência',
    },
  ];

  const celulasMes = Array.from({ length: totalDias }, (_, i) => {
    const dia = i + 1;
    const dataISO = paraDataISO({ ano, mes, dia });
    if (ehGerencia) {
      const coberturas = obterCoberturasDoDia(dataISO, excecoes, nomes).filter(
        (c) => c.coberturaPorId === 'gerente1'
      );
      return { dia, dataISO, calc: null, coberturas };
    }
    const calc = calcularEscalaDia(dataISO, pessoaId as FuncionarioId, excecoes);
    return { dia, dataISO, calc, coberturas: [] };
  });

  // Agrupa as semanas do mês
  const semanasMapa = new Map<
    string,
    {
      segundaISO: string;
      domingoISO: string;
      numeroSemana: number;
      escala: 'A' | 'B' | null;
      minutos: number;
      diasTrabalhados: number;
    }
  >();

  for (let d = 1; d <= totalDias; d++) {
    const dataISO = paraDataISO({ ano, mes, dia: d });
    const infoSem = obterInfoSemana(dataISO);
    if (!semanasMapa.has(infoSem.segundaISO)) {
      if (ehGerencia) {
        const resCob = calcularResumoCoberturaSemana(infoSem.segundaISO, 'gerente1', excecoes, nomes);
        semanasMapa.set(infoSem.segundaISO, {
          segundaISO: infoSem.segundaISO,
          domingoISO: infoSem.domingoISO,
          numeroSemana: infoSem.numeroSemana,
          escala: null,
          minutos: resCob.minutos,
          diasTrabalhados: resCob.diasCobrindo,
        });
      } else {
        let minutos = 0;
        let diasTrabalhados = 0;
        for (const diaSemISO of infoSem.diasDaSemana) {
          const res = calcularEscalaDia(diaSemISO, pessoaId as FuncionarioId, excecoes);
          if (res.trabalha) {
            diasTrabalhados += 1;
            minutos += res.minutosTrabalhados;
          }
        }
        semanasMapa.set(infoSem.segundaISO, {
          segundaISO: infoSem.segundaISO,
          domingoISO: infoSem.domingoISO,
          numeroSemana: infoSem.numeroSemana,
          escala: obterEscalaDaSemana(infoSem.segundaISO, pessoaId as FuncionarioId),
          minutos,
          diasTrabalhados,
        });
      }
    }
  }

  const semanasDoMes = Array.from(semanasMapa.values());
  const nomeSelecionado = opcoesPessoas.find((p) => p.id === pessoaId)?.nome || nomes.vendedor1;
  const alertasLongaCobertura = ehGerencia
    ? detectarSequenciasLongasCobertura(excecoes, 'gerente1', nomes)
    : [];

  return (
    <section className="stack-md" aria-label="Minha escala">
      <div className="card-superficie">
        <h1 className="titulo-secao">Minha escala</h1>
        <p className="subtitulo-secao">
          Escolha seu nome para guardar sua escala neste aparelho.
        </p>

        <div className="seletor-func-grid-5">
          {opcoesPessoas.map((p) => {
            const ativo = p.id === pessoaId;
            return (
              <button
                key={p.id}
                type="button"
                className={`btn-func-opcao ${ativo ? 'ativo' : ''}`}
                onClick={() => setPessoaId(p.id)}
              >
                <span>{p.nome}</span>
                <span className="btn-func-sub">{p.equipe}</span>
              </button>
            );
          })}
        </div>
      </div>

      {ehGerencia &&
        alertasLongaCobertura.map((alerta) => (
          <div key={alerta.id} className="caixa-alerta-ambar" role="alert">
            <AlertTriangle size={20} className="icone-alerta-ambar" />
            <div>
              <p className="alerta-titulo">{alerta.titulo}</p>
              <p className="alerta-texto">{alerta.mensagem}</p>
            </div>
          </div>
        ))}

      <div className="card-superficie stack-sm">
        <div className="row-between">
          <div>
            <h2 className="titulo-equipe">
              {MESES_PT[mes - 1]} de {ano} · {nomeSelecionado}
            </h2>
          </div>
          <div className="row-gap-sm">
            <button
              type="button"
              className="btn-secundario"
              aria-label="Mês anterior"
              onClick={() => mudarMes(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="btn-secundario"
              aria-label="Próximo mês"
              onClick={() => mudarMes(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="calendario-grid">
          {DIAS_SEMANA_CURTOS.map((label) => (
            <div key={label} className="calendario-cabecalho">
              {label}
            </div>
          ))}

          {Array.from({ length: offsetInicio }).map((_, idx) => (
            <div key={`vazio-${idx}`} className="calendario-celula vazia" />
          ))}

          {celulasMes.map(({ dia, dataISO, calc, coberturas }) => {
            const ehHoje = dataISO === hojeReal;

            if (ehGerencia) {
              const temCob = coberturas.length > 0;
              return (
                <div
                  key={dataISO}
                  className={`calendario-celula ${temCob ? 'cobertura' : ''} ${
                    ehHoje ? 'hoje' : ''
                  }`}
                >
                  <span className="calendario-dia-num tabular-nums">{dia}</span>
                  {temCob ? (
                    <span className="calendario-dia-status font-horario">
                      {coberturas[0].inicio}
                    </span>
                  ) : (
                    <span className="calendario-dia-status texto-suave">—</span>
                  )}
                </div>
              );
            }

            const classeStatus =
              calc!.status === 'ferias'
                ? 'ferias'
                : calc!.status === 'folga' || calc!.status === 'ausencia'
                  ? 'folga'
                  : '';

            return (
              <div
                key={dataISO}
                className={`calendario-celula ${classeStatus} ${ehHoje ? 'hoje' : ''}`}
              >
                <span className="calendario-dia-num tabular-nums">{dia}</span>
                {calc!.trabalha ? (
                  <span className="calendario-dia-status font-horario">
                    {calc!.horario?.inicio}
                  </span>
                ) : calc!.status === 'ferias' ? (
                  <span className="calendario-dia-status funcionario-rotulo-ferias">Férias</span>
                ) : calc!.status === 'regime_antigo' ? (
                  <span className="calendario-dia-status texto-suave">—</span>
                ) : (
                  <span className="calendario-dia-status funcionario-rotulo-folga">
                    {calc!.rotulo}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-superficie stack-sm">
        <h2 className="titulo-equipe">
          {ehGerencia ? 'Horas de cobertura na semana' : 'Escala e horas por semana'}
        </h2>
        <div className="lista-funcionarios">
          {semanasDoMes.map((sem) => (
            <div key={sem.segundaISO} className="item-funcionario">
              <div className="item-funcionario-topo">
                <span className="funcionario-nome tabular-nums">
                  {formatarDiaMesBR(sem.segundaISO)} a {formatarDiaMesBR(sem.domingoISO)}
                </span>
                <span className="funcionario-horario font-horario">
                  {ehGerencia
                    ? `Cobertura: ${formatarMinutosEmHoras(sem.minutos)}`
                    : `Escala ${sem.escala} · ${formatarMinutosEmHoras(sem.minutos)}`}
                </span>
              </div>
              <span className="texto-suave tabular-nums">
                {sem.numeroSemana > 0 ? `Semana ${sem.numeroSemana} · ` : ''}
                {ehGerencia
                  ? `${sem.diasTrabalhados} dia(s) cobrindo`
                  : `${sem.diasTrabalhados} dia(s) de trabalho`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
