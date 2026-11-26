import { ChevronLeft, ChevronRight } from 'lucide-react';
import { obterCoberturasDoDia } from '../cobertura.js';
import {
  analisarDiaLoja,
  DATA_INICIO_NOVA_ESCALA,
  DIAS_SEMANA_CURTOS,
  formatarDataBR,
  formatarDiaMesBR,
  FUNCIONARIOS_LISTA,
  obterHojeSaoPaulo,
  obterInfoSemana,
  somarDias,
} from '../escala.js';
import type { Excecao, NomesEquipe } from '../types';

interface SemanaViewProps {
  dataReferencia: string;
  onChangeDataReferencia: (novaData: string) => void;
  excecoes: Excecao[];
  nomes: NomesEquipe;
}

export function SemanaView({
  dataReferencia,
  onChangeDataReferencia,
  excecoes,
  nomes,
}: SemanaViewProps) {
  const hojeReal = obterHojeSaoPaulo();
  const info = obterInfoSemana(dataReferencia);
  const infoHoje = obterInfoSemana(hojeReal);
  const ehSemanaAtual = info.segundaISO === infoHoje.segundaISO;

  const diasSemana = info.diasDaSemana.map((dataISO, idx) => {
    const analise = analisarDiaLoja(dataISO, excecoes, nomes);
    const coberturasGerencia = obterCoberturasDoDia(dataISO, excecoes, nomes).filter(
      (c) => c.coberturaPorId === 'gerente1'
    );
    const todos = [...analise.vendedores, ...analise.administrativo];
    return {
      dataISO,
      diaCurto: DIAS_SEMANA_CURTOS[idx],
      diaMes: formatarDiaMesBR(dataISO),
      ehHoje: dataISO === hojeReal,
      analise,
      todos,
      coberturasGerencia,
    };
  });

  return (
    <section className="stack-md" aria-label="Grade da semana">
      <div className="card-superficie stack-sm">
        <div className="semana-toolbar">
          <div>
            <h1 className="titulo-secao">
              Semana {info.numeroSemana > 0 ? info.numeroSemana : 'anterior'}
              {ehSemanaAtual ? ' · Semana atual' : ''}
            </h1>
            <p className="subtitulo-secao tabular-nums">
              {formatarDataBR(info.segundaISO)} a {formatarDataBR(info.domingoISO)}
            </p>
          </div>

          <div className="row-gap-sm">
            {!ehSemanaAtual && (
              <button
                type="button"
                className="btn-secundario"
                onClick={() => onChangeDataReferencia(hojeReal)}
              >
                Semana atual
              </button>
            )}
            {info.domingoISO < DATA_INICIO_NOVA_ESCALA && (
              <button
                type="button"
                className="btn-primario"
                onClick={() => onChangeDataReferencia(DATA_INICIO_NOVA_ESCALA)}
              >
                Ir para 15/12/2026
              </button>
            )}
          </div>
        </div>

        <div className="row-between">
          <button
            type="button"
            className="btn-secundario"
            onClick={() => onChangeDataReferencia(somarDias(info.segundaISO, -7))}
          >
            <ChevronLeft size={18} />
            Semana anterior
          </button>
          <button
            type="button"
            className="btn-secundario"
            onClick={() => onChangeDataReferencia(somarDias(info.segundaISO, 7))}
          >
            Próxima semana
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Visão em cartões por dia no celular */}
      <div className="semana-lista-mobile">
        {diasSemana.map((d) => (
          <div
            key={d.dataISO}
            className={`semana-dia-card stack-sm ${d.ehHoje ? 'hoje-destaque' : ''}`}
          >
            <div className="row-between">
              <strong className="funcionario-nome tabular-nums">
                {d.analise.diaSemanaLabel} · {d.diaMes}
                {d.ehHoje ? ' (Hoje)' : ''}
              </strong>
              {d.analise.lojaFechada && (
                <span className="texto-suave">
                  Loja fechada{d.analise.lojaAlterada ? ' · alterado' : ''}
                </span>
              )}
            </div>

            <div className="lista-funcionarios">
              {d.todos.map((item) => (
                <div
                  key={item.funcionarioId}
                  className={`item-funcionario ${
                    item.status === 'ferias'
                      ? 'status-ferias'
                      : !item.trabalha
                        ? 'status-folga'
                        : ''
                  }`}
                >
                  <div className="item-funcionario-topo">
                    <span className="funcionario-nome">{item.nome}</span>
                    {item.trabalha ? (
                      <span className="funcionario-horario font-horario">
                        Trabalha · {item.horario?.texto}
                      </span>
                    ) : item.status === 'ferias' ? (
                      <span className="funcionario-rotulo-ferias">Férias</span>
                    ) : (
                      <span className="funcionario-rotulo-folga">{item.rotulo}</span>
                    )}
                  </div>
                  {item.alterado && (
                    <div className="row-gap-sm">
                      <span className="selo-alterado">
                        alterado{item.motivoAlteracao ? ` · ${item.motivoAlteracao}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Gerência só aparece nos dias com cobertura */}
              {d.coberturasGerencia.map((cob) => (
                <div key={`${cob.excecaoId}-${cob.inicio}`} className="item-funcionario status-ferias">
                  <div className="item-funcionario-topo">
                    <span className="funcionario-nome">
                      {nomes.gerente1} (Gerência)
                    </span>
                    <span className="funcionario-horario font-horario">
                      Cobre · {cob.texto}
                    </span>
                  </div>
                  <span className="funcionario-detalhe">
                    No lugar de {cob.cobreFuncionarioNome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Grade tabular para tablet/desktop com 5ª linha Gerência */}
      <div className="semana-tabela-wrap">
        <table className="semana-tabela">
          <thead>
            <tr>
              <th>Funcionário</th>
              {diasSemana.map((d) => (
                <th key={d.dataISO} className={d.ehHoje ? 'col-hoje' : ''}>
                  <div>{d.diaCurto}</div>
                  <div className="texto-suave tabular-nums">{d.diaMes}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUNCIONARIOS_LISTA.map((meta) => {
              const nome = nomes[meta.id] || meta.nomePadrao;
              return (
                <tr key={meta.id}>
                  <td>
                    <div className="funcionario-nome">{nome}</div>
                    <div className="texto-suave">{meta.equipe}</div>
                  </td>
                  {diasSemana.map((d) => {
                    const cel = d.todos.find((x) => x.funcionarioId === meta.id)!;
                    const celClass =
                      cel.status === 'ferias'
                        ? 'celula-ferias'
                        : !cel.trabalha
                          ? 'celula-folga'
                          : '';
                    return (
                      <td key={d.dataISO} className={celClass}>
                        {cel.trabalha ? (
                          <div className="stack-sm">
                            <span className="funcionario-horario">Trabalha</span>
                            <span className="font-horario texto-suave">{cel.horario?.texto}</span>
                          </div>
                        ) : cel.status === 'ferias' ? (
                          <span className="funcionario-rotulo-ferias">Férias</span>
                        ) : (
                          <span className="funcionario-rotulo-folga">{cel.rotulo}</span>
                        )}
                        {cel.alterado && (
                          <div className="selo-topo-espaco">
                            <span className="selo-alterado">alterado</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* 5ª linha: Gerência — células preenchidas apenas nos dias de cobertura */}
            <tr>
              <td>
                <div className="funcionario-nome">{nomes.gerente1}</div>
                <div className="texto-suave">Gerência</div>
              </td>
              {diasSemana.map((d) => {
                const temCobertura = d.coberturasGerencia.length > 0;
                return (
                  <td key={d.dataISO} className={temCobertura ? 'celula-cobertura' : ''}>
                    {temCobertura &&
                      d.coberturasGerencia.map((c) => (
                        <div key={`${c.excecaoId}-${c.inicio}`} className="stack-sm">
                          <span className="funcionario-rotulo-ferias">Cobre</span>
                          <span className="font-horario texto-suave">{c.texto}</span>
                          <span className="texto-suave">({c.cobreFuncionarioNome})</span>
                        </div>
                      ))}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
