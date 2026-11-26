import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { analisarCoberturaDia, resolverNomePessoa } from '../cobertura.js';
import {
  analisarDiaLoja,
  DATA_INICIO_NOVA_ESCALA,
  formatarDiaMesBR,
  obterHojeSaoPaulo,
  somarDias,
} from '../escala.js';
import type { Excecao, NomesEquipe, PessoaId, RegistroDiaFuncionario } from '../types';

interface HojeViewProps {
  dataSelecionada: string;
  onChangeData: (novaData: string) => void;
  excecoes: Excecao[];
  nomes: NomesEquipe;
}

function CartaoFuncionario({
  item,
  nomes,
}: {
  item: RegistroDiaFuncionario;
  nomes: NomesEquipe;
}) {
  const statusClass =
    item.status === 'ferias'
      ? 'status-ferias'
      : !item.trabalha
        ? 'status-folga'
        : '';
  const nomeCobertor = item.quemCobre
    ? resolverNomePessoa(item.quemCobre as PessoaId, nomes)
    : '';

  return (
    <div className={`item-funcionario ${statusClass}`}>
      <div className="item-funcionario-topo">
        <span className="funcionario-nome">{item.nome}</span>
        {item.trabalha ? (
          <span className="funcionario-horario font-horario">{item.horario?.texto}</span>
        ) : item.status === 'ferias' ? (
          <span className="funcionario-rotulo-ferias">Férias</span>
        ) : (
          <span className="funcionario-rotulo-folga">{item.rotulo}</span>
        )}
      </div>

      <div className="row-gap-sm">
        <span className="texto-suave">Escala {item.escalaSemana}</span>
        {item.status === 'ferias' && item.dataRetorno && (
          <span className="texto-suave tabular-nums">
            · volta em {formatarDiaMesBR(item.dataRetorno)}
          </span>
        )}
        {item.status === 'ferias' && nomeCobertor && (
          <span className="texto-suave">· coberto por {nomeCobertor}</span>
        )}
        {item.alterado && (
          <span className="selo-alterado">
            alterado{item.motivoAlteracao ? ` · ${item.motivoAlteracao}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export function HojeView({
  dataSelecionada,
  onChangeData,
  excecoes,
  nomes,
}: HojeViewProps) {
  const hojeReal = obterHojeSaoPaulo();
  const dia = analisarDiaLoja(dataSelecionada, excecoes, nomes);
  const cob = analisarCoberturaDia(dataSelecionada, excecoes, nomes);
  const ehHoje = dataSelecionada === hojeReal;
  const emFerias = [...dia.vendedores, ...dia.administrativo].filter(
    (f) => f.status === 'ferias'
  );

  return (
    <section className="stack-md" aria-label="Escala do dia">
      <div className="card-superficie hoje-header-card">
        <div className="row-between">
          <div>
            <h1 className="titulo-secao">{dia.diaSemanaLabel}</h1>
            <p className="subtitulo-secao tabular-nums">
              {dia.dataBR}
              {!dia.antesDoInicio ? ` · Semana ${dia.numeroSemana}` : ''}
              {ehHoje ? ' · Hoje' : ''}
            </p>
          </div>
          {!ehHoje && (
            <button
              type="button"
              className="btn-secundario"
              onClick={() => onChangeData(hojeReal)}
            >
              <Calendar size={18} />
              Hoje
            </button>
          )}
        </div>

        <div className="hoje-nav-row">
          <button
            type="button"
            className="btn-secundario"
            onClick={() => onChangeData(somarDias(dataSelecionada, -1))}
          >
            <ChevronLeft size={18} />
            Ontem
          </button>
          <span className="texto-suave tabular-nums">08:30 – 19:30</span>
          <button
            type="button"
            className="btn-secundario"
            onClick={() => onChangeData(somarDias(dataSelecionada, 1))}
          >
            Amanhã
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {dia.antesDoInicio && (
        <div className="caixa-aviso-inicio">
          <div>
            <p className="alerta-titulo">Nova escala inicia em 15/12/2026</p>
            <p className="texto-suave">
              A semana 1 começa em 14/12/2026, mas a segunda 14/12 ainda segue o regime antigo.
            </p>
          </div>
          <button
            type="button"
            className="btn-primario"
            onClick={() => onChangeData(DATA_INICIO_NOVA_ESCALA)}
          >
            Ver 15/12/2026
          </button>
        </div>
      )}

      {/* Aviso neutro quando o dia está totalmente coberto por João / cobertura */}
      {cob.totalmenteCoberto && cob.resumoNeutralCobertura && (
        <div className="caixa-cobertura-neutra">
          <CheckCircle2 size={20} className="icone-cobertura-neutra" />
          <div>
            <p className="funcionario-nome">Vendas cobertas</p>
            <p className="texto-suave">{cob.resumoNeutralCobertura}</p>
          </div>
        </div>
      )}

      {/* Alerta âmbar quando João tem coberturas em horários sobrepostos */}
      {cob.coberturaSobrepostaGerente && (
        <div className="caixa-alerta-ambar" role="alert">
          <AlertTriangle size={22} className="icone-alerta-ambar" />
          <div>
            <p className="alerta-titulo">Cobertura sobreposta para {nomes.gerente1}</p>
            <p className="alerta-texto">
              {nomes.gerente1} está escalado para cobrir dois horários sobrepostos neste dia.
            </p>
          </div>
        </div>
      )}

      {/* Alerta âmbar só para o que continuar descoberto ou vendedor único padrão */}
      {cob.alertaAmbarCobertura && (
        <div className="caixa-alerta-ambar" role="alert">
          <AlertTriangle size={22} className="icone-alerta-ambar" />
          <div>
            <p className="alerta-titulo">{cob.alertaAmbarCobertura.titulo}</p>
            <p className="alerta-texto">{cob.alertaAmbarCobertura.mensagem}</p>
          </div>
        </div>
      )}

      {dia.lojaFechada ? (
        <div className="caixa-loja-fechada">
          <div className="row-gap-sm">
            <Lock size={20} className="brand-icon" />
            <h2 className="titulo-equipe">Loja fechada</h2>
            {dia.lojaAlterada && <span className="selo-alterado">alterado</span>}
          </div>
          <p className="texto-suave">
            {dia.motivoLojaFechada || 'Domingo — loja fechada.'}
          </p>
          <hr className="divisor-madeira" />
          <div className="lista-funcionarios w-full-lista">
            {[...dia.vendedores, ...dia.administrativo].map((item) => (
              <CartaoFuncionario key={item.funcionarioId} item={item} nomes={nomes} />
            ))}
          </div>
        </div>
      ) : dia.antesDoInicio ? (
        emFerias.length > 0 && (
          <div className="card-superficie stack-sm">
            <h2 className="titulo-equipe">Férias registradas nesta data</h2>
            <div className="lista-funcionarios">
              {emFerias.map((item) => (
                <CartaoFuncionario key={item.funcionarioId} item={item} nomes={nomes} />
              ))}
            </div>
          </div>
        )
      ) : (
        <>
          <div className="hoje-grid">
            <div className="card-superficie">
              <h2 className="titulo-equipe">
                <span>Vendedores</span>
                <span className="texto-suave">
                  {dia.vendedores.filter((v) => v.trabalha).length} trabalhando
                </span>
              </h2>
              <div className="lista-funcionarios">
                {dia.vendedores.map((item) => (
                  <CartaoFuncionario key={item.funcionarioId} item={item} nomes={nomes} />
                ))}
              </div>
            </div>

            <div className="card-superficie">
              <h2 className="titulo-equipe">
                <span>Administrativo</span>
                <span className="texto-suave">
                  {dia.administrativo.filter((a) => a.trabalha).length} trabalhando
                </span>
              </h2>
              <div className="lista-funcionarios">
                {dia.administrativo.map((item) => (
                  <CartaoFuncionario key={item.funcionarioId} item={item} nomes={nomes} />
                ))}
              </div>
            </div>
          </div>

          {/* Cartão da equipe Gerência */}
          <div className="card-superficie stack-sm">
            <h2 className="titulo-equipe">
              <span>Gerência · {nomes.gerente1}</span>
              <span className="texto-suave">
                {cob.coberturasGerencia.length > 0 ? 'Em cobertura' : 'Sem escala fixa'}
              </span>
            </h2>
            {cob.coberturasGerencia.length === 0 ? (
              <div className="item-funcionario">
                <div className="item-funcionario-topo">
                  <span className="funcionario-nome">{nomes.gerente1}</span>
                  <span className="texto-suave">Sem escala fixa</span>
                </div>
              </div>
            ) : (
              <div className="lista-funcionarios">
                {cob.coberturasGerencia.map((c) => (
                  <div key={`${c.excecaoId}-${c.inicio}`} className="item-funcionario status-ferias">
                    <div className="item-funcionario-topo">
                      <span className="funcionario-nome">{nomes.gerente1}</span>
                      <span className="funcionario-horario font-horario">{c.texto}</span>
                    </div>
                    <span className="funcionario-detalhe">
                      Cobrindo vendas, {c.inicio} às {c.fim}, no lugar de {c.cobreFuncionarioNome}
                    </span>
                    <div className="row-gap-sm">
                      <span className="selo-alterado">alterado · {c.motivo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-superficie stack-sm">
            <h2 className="titulo-equipe">
              <span>Quem folga hoje</span>
              <span className="texto-suave">{dia.naoTrabalhando.length} pessoa(s)</span>
            </h2>
            {dia.naoTrabalhando.length === 0 ? (
              <p className="texto-suave">Todos os funcionários estão escalados hoje.</p>
            ) : (
              <div className="lista-funcionarios">
                {dia.naoTrabalhando.map((item) => {
                  const nomeCobertor = item.quemCobre
                    ? resolverNomePessoa(item.quemCobre as PessoaId, nomes)
                    : '';
                  return (
                    <div
                      key={item.funcionarioId}
                      className={`item-funcionario ${
                        item.status === 'ferias' ? 'status-ferias' : 'status-folga'
                      }`}
                    >
                      <div className="item-funcionario-topo">
                        <span className="funcionario-nome">
                          {item.nome} · {item.equipe}
                        </span>
                        <span
                          className={
                            item.status === 'ferias'
                              ? 'funcionario-rotulo-ferias'
                              : 'funcionario-rotulo-folga'
                          }
                        >
                          {item.rotulo}
                        </span>
                      </div>
                      {item.status === 'ferias' && (
                        <span className="funcionario-detalhe tabular-nums">
                          {item.dataRetorno
                            ? `Volta em ${formatarDiaMesBR(item.dataRetorno)}`
                            : 'Em período de férias'}
                          {nomeCobertor ? ` · coberto por ${nomeCobertor}` : ''}
                        </span>
                      )}
                      {item.alterado && item.motivoAlteracao && (
                        <div className="row-gap-sm">
                          <span className="selo-alterado">alterado · {item.motivoAlteracao}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
