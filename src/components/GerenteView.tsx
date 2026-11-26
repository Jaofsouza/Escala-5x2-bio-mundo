import {
  AlertTriangle,
  CalendarOff,
  Edit3,
  History,
  KeyRound,
  Lock,
  Palmtree,
  RefreshCw,
  ShieldPlus,
  Trash2,
  Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  gerarAlertasGerenteComCobertura,
  resolverNomePessoa,
} from '../cobertura.js';
import {
  calcularDataRetornoFerias,
  formatarDataBR,
  formatarDiaMesBR,
  FUNCIONARIOS_LISTA,
  obterHojeSaoPaulo,
  verificarTrocaDentroDeFerias,
} from '../escala.js';
import {
  criarCobertura,
  criarExcecao,
  editarFerias,
  removerCoberturaDeUmDia,
  removerExcecao,
  salvarNomesEquipe,
  trocarCoberturaDeUmDiaPorFaixa,
} from '../store/escalaStore';
import type {
  AlertaCoberturaGerente,
  Excecao,
  FuncionarioId,
  HistoricoItem,
  ModoCobertura,
  NomesEquipe,
  NovoEstadoTroca,
  PessoaId,
} from '../types';
import { TestesSecao8View } from './TestesSecao8View';

interface GerenteViewProps {
  pinGerente: string;
  desbloqueado: boolean;
  onDesbloquear: () => void;
  onBloquear: () => void;
  excecoes: Excecao[];
  historico: HistoricoItem[];
  nomes: NomesEquipe;
}

type AbaGerente = 'gestao' | 'testes';
type FormularioAtivo = 'ferias' | 'cobertura' | 'troca' | 'ausencia' | 'loja_fechada' | 'nomes';

function labelCategoria(cat: HistoricoItem['categoria']): string {
  switch (cat) {
    case 'ferias':
      return 'Férias';
    case 'cobertura':
      return 'Cobertura';
    case 'troca_folga':
      return 'Troca de folga';
    case 'ausencia':
      return 'Ausência';
    case 'loja_fechada':
      return 'Loja fechada';
    case 'equipe':
      return 'Equipe';
  }
}

function labelAcao(acao: HistoricoItem['acao']): string {
  switch (acao) {
    case 'criacao':
      return 'Criação';
    case 'edicao':
      return 'Edição';
    case 'remocao':
      return 'Remoção';
  }
}

function obterColegaDaMesmaEquipe(funcId: FuncionarioId): FuncionarioId {
  switch (funcId) {
    case 'vendedor1':
      return 'vendedor2';
    case 'vendedor2':
      return 'vendedor1';
    case 'admin1':
      return 'admin2';
    case 'admin2':
      return 'admin1';
  }
}

export function GerenteView({
  pinGerente,
  desbloqueado,
  onDesbloquear,
  onBloquear,
  excecoes,
  historico,
  nomes,
}: GerenteViewProps) {
  const hojeDefault = obterHojeSaoPaulo();

  const [pinDigitado, setPinDigitado] = useState('');
  const [erroPin, setErroPin] = useState('');
  const [abaInterna, setAbaInterna] = useState<AbaGerente>('gestao');
  const [formAtivo, setFormAtivo] = useState<FormularioAtivo>('ferias');

  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  // Estado do formulário de Férias (criação e edição)
  const [feriasEditando, setFeriasEditando] = useState<Excecao | null>(null);
  const [feriasFunc, setFeriasFunc] = useState<FuncionarioId>('vendedor1');
  const [feriasInicio, setFeriasInicio] = useState('2026-12-15');
  const [feriasFim, setFeriasFim] = useState('2026-12-22');
  const [feriasQuemCobre, setFeriasQuemCobre] = useState(''); // sempre começa vazio ("Ninguém")
  const [feriasMotivo, setFeriasMotivo] = useState('');

  // Estado do formulário de Cobertura avulsa
  const [cobPorId, setCobPorId] = useState<PessoaId>('gerente1');
  const [cobAlvoId, setCobAlvoId] = useState<FuncionarioId>('vendedor2');
  const [cobInicio, setCobInicio] = useState('2026-12-15');
  const [cobFim, setCobFim] = useState('2026-12-15');
  const [cobModo, setCobModo] = useState<Exclude<ModoCobertura, ''>>('turno_completo');
  const [cobHoraIni, setCobHoraIni] = useState('17:30');
  const [cobHoraFim, setCobHoraFim] = useState('19:30');
  const [cobMotivo, setCobMotivo] = useState('');

  // Estado para ajuste de 1 dia específico de uma cobertura existente
  const [ajusteCobId, setAjusteCobId] = useState<string | null>(null);
  const [ajusteData, setAjusteData] = useState('2026-12-15');
  const [ajusteAcao, setAjusteAcao] = useState<'remover' | 'faixa'>('remover');
  const [ajusteHoraIni, setAjusteHoraIni] = useState('17:30');
  const [ajusteHoraFim, setAjusteHoraFim] = useState('19:30');
  const [ajusteMotivo, setAjusteMotivo] = useState('');

  // Estado do formulário de Troca de Folga
  const [trocaFunc, setTrocaFunc] = useState<FuncionarioId>('vendedor1');
  const [trocaData, setTrocaData] = useState('2026-12-19');
  const [trocaEstado, setTrocaEstado] = useState<NovoEstadoTroca>('trabalha');
  const [trocaMotivo, setTrocaMotivo] = useState('');

  // Estado do formulário de Ausência Comum
  const [ausenciaFunc, setAusenciaFunc] = useState<FuncionarioId>('admin1');
  const [ausenciaInicio, setAusenciaInicio] = useState(hojeDefault);
  const [ausenciaFim, setAusenciaFim] = useState(hojeDefault);
  const [ausenciaMotivo, setAusenciaMotivo] = useState('');

  // Estado do formulário de Loja Fechada / Feriado
  const [fechadaInicio, setFechadaInicio] = useState('2027-01-01');
  const [fechadaFim, setFechadaFim] = useState('2027-01-01');
  const [fechadaMotivo, setFechadaMotivo] = useState('');

  // Estado do formulário de Edição de Nomes
  const [nomesForm, setNomesForm] = useState<NomesEquipe>({ ...nomes });

  function handleEntrarPin(e: FormEvent) {
    e.preventDefault();
    if (pinDigitado.trim() === pinGerente) {
      setErroPin('');
      setPinDigitado('');
      setNomesForm({ ...nomes });
      onDesbloquear();
    } else {
      setErroPin('PIN incorreto. Tente novamente.');
    }
  }

  if (!desbloqueado) {
    return (
      <section className="pin-card" aria-label="Acesso do gerente">
        <form className="card-superficie stack-md" onSubmit={handleEntrarPin}>
          <div className="row-gap-sm">
            <KeyRound size={22} className="brand-icon" />
            <h1 className="titulo-secao">Área do Gerente</h1>
          </div>
          <p className="texto-suave">
            Digite o PIN do gerente para editar férias, coberturas, folgas, ausências, nomes e acessar os testes.
          </p>

          <div className="campo-grupo">
            <label htmlFor="pin-gerente" className="campo-label">
              PIN do gerente
            </label>
            <input
              id="pin-gerente"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              className="campo-input font-horario"
              value={pinDigitado}
              onChange={(e) => setPinDigitado(e.target.value)}
              placeholder="Digite o PIN"
            />
          </div>

          {erroPin && <div className="erro-inline">{erroPin}</div>}

          <button type="submit" className="btn-primario">
            Entrar
          </button>
        </form>
      </section>
    );
  }

  const alertas = gerarAlertasGerenteComCobertura(excecoes, nomes);
  const feriasLista = excecoes.filter((e) => e.tipo === 'ferias');
  const coberturasLista = excecoes.filter((e) => e.tipo === 'cobertura');
  const outrasExcecoes = excecoes.filter(
    (e) => e.tipo !== 'ferias' && e.tipo !== 'cobertura'
  );

  const retornoPrevisto =
    feriasInicio && feriasFim && feriasInicio <= feriasFim
      ? calcularDataRetornoFerias(feriasFim, feriasFunc, excecoes)
      : null;

  const conflitoTrocaFerias = verificarTrocaDentroDeFerias(trocaFunc, trocaData, excecoes);
  const outroColegaId = obterColegaDaMesmaEquipe(feriasFunc);

  function iniciarEdicaoFerias(item: Excecao) {
    setFormAtivo('ferias');
    setFeriasEditando(item);
    setFeriasFunc((item.funcionarioId || 'vendedor1') as FuncionarioId);
    setFeriasInicio(item.dataInicio);
    setFeriasFim(item.dataFim);
    setFeriasQuemCobre(item.quemCobre || '');
    setFeriasMotivo(item.motivo || '');
    setFeedback(null);
  }

  function cancelarEdicaoFerias() {
    setFeriasEditando(null);
    setFeriasQuemCobre('');
    setFeriasMotivo('');
  }

  async function handleCobrirAlertaComJoao(alerta: AlertaCoberturaGerente) {
    if (!alerta.intervalo) return;
    setFeedback(null);
    setSalvando(true);
    try {
      await criarCobertura({
        coberturaPorId: 'gerente1',
        cobreFuncionarioId: alerta.intervalo.cobreFuncionarioSugeridoId,
        dataInicio: alerta.data,
        dataFim: alerta.data,
        modo: 'faixa',
        horaInicio: alerta.intervalo.inicio,
        horaFim: alerta.intervalo.fim,
        motivo: 'horário descoberto',
        nomes,
      });
      setFeedback({
        tipo: 'ok',
        texto: `${nomes.gerente1} cadastrado cobrindo ${alerta.intervalo.texto} em ${formatarDataBR(
          alerta.data
        )}.`,
      });
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao criar cobertura.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarFerias(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!feriasInicio || !feriasFim || feriasInicio > feriasFim) {
      setFeedback({ tipo: 'erro', texto: 'A data de fim deve ser igual ou posterior ao início.' });
      return;
    }

    setSalvando(true);
    try {
      const nomeFunc = nomes[feriasFunc];
      const motivoFinal = feriasMotivo.trim() || 'Férias programadas';

      if (feriasEditando) {
        await editarFerias(
          feriasEditando,
          {
            funcionarioId: feriasFunc,
            dataInicio: feriasInicio,
            dataFim: feriasFim,
            quemCobre: feriasQuemCobre,
            motivo: motivoFinal,
          },
          excecoes,
          nomes
        );
        setFeriasEditando(null);
        setFeedback({ tipo: 'ok', texto: `Férias de ${nomeFunc} atualizadas com sucesso.` });
      } else {
        await criarExcecao({
          tipo: 'ferias',
          funcionarioId: feriasFunc,
          dataInicio: feriasInicio,
          dataFim: feriasFim,
          quemCobre: feriasQuemCobre,
          motivo: motivoFinal,
          nomeAfetado: nomeFunc,
          nomes,
        });
        setFeedback({ tipo: 'ok', texto: `Férias de ${nomeFunc} registradas com sucesso.` });
      }
      setFeriasQuemCobre('');
      setFeriasMotivo('');
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao salvar férias.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarCoberturaManual(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!cobInicio || !cobFim || cobInicio > cobFim) {
      setFeedback({ tipo: 'erro', texto: 'A data final deve ser igual ou posterior à inicial.' });
      return;
    }
    if (cobModo === 'faixa' && (!cobHoraIni || !cobHoraFim || cobHoraIni >= cobHoraFim)) {
      setFeedback({ tipo: 'erro', texto: 'Informe uma faixa de horário válida (início < fim).' });
      return;
    }

    setSalvando(true);
    try {
      await criarCobertura({
        coberturaPorId: cobPorId,
        cobreFuncionarioId: cobAlvoId,
        dataInicio: cobInicio,
        dataFim: cobFim,
        modo: cobModo,
        horaInicio: cobModo === 'faixa' ? cobHoraIni : '',
        horaFim: cobModo === 'faixa' ? cobHoraFim : '',
        motivo: cobMotivo.trim() || 'Cobertura de vendas',
        nomes,
      });
      setCobMotivo('');
      setFeedback({ tipo: 'ok', texto: 'Cobertura registrada com sucesso.' });
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao registrar cobertura.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleAplicarAjusteUmDia(cob: Excecao) {
    setFeedback(null);
    if (!ajusteData || ajusteData < cob.dataInicio || ajusteData > cob.dataFim) {
      setFeedback({
        tipo: 'erro',
        texto: `Escolha uma data dentro do período (${formatarDataBR(cob.dataInicio)} a ${formatarDataBR(
          cob.dataFim
        )}).`,
      });
      return;
    }
    if (ajusteAcao === 'faixa' && (!ajusteHoraIni || !ajusteHoraFim || ajusteHoraIni >= ajusteHoraFim)) {
      setFeedback({ tipo: 'erro', texto: 'Informe um horário válido (início menor que fim).' });
      return;
    }

    setSalvando(true);
    try {
      if (ajusteAcao === 'remover') {
        await removerCoberturaDeUmDia(
          cob,
          ajusteData,
          nomes,
          ajusteMotivo || 'Cobertura do dia removida'
        );
        setFeedback({
          tipo: 'ok',
          texto: `Cobertura de ${formatarDataBR(ajusteData)} removida. Alertas atualizados.`,
        });
      } else {
        await trocarCoberturaDeUmDiaPorFaixa(
          cob,
          ajusteData,
          ajusteHoraIni,
          ajusteHoraFim,
          ajusteMotivo || 'Faixa ajustada pelo gerente',
          nomes
        );
        setFeedback({
          tipo: 'ok',
          texto: `Cobertura de ${formatarDataBR(ajusteData)} alterada para ${ajusteHoraIni} às ${ajusteHoraFim}.`,
        });
      }
      setAjusteCobId(null);
      setAjusteMotivo('');
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao ajustar dia da cobertura.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarTroca(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const conflito = verificarTrocaDentroDeFerias(trocaFunc, trocaData, excecoes);
    if (conflito) {
      setFeedback({
        tipo: 'erro',
        texto: `Bloqueado: ${nomes[trocaFunc]} está de férias de ${formatarDataBR(
          conflito.dataInicio
        )} a ${formatarDataBR(conflito.dataFim)}. Não é possível criar troca de folga dentro das férias.`,
      });
      return;
    }

    if (!trocaMotivo.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe o motivo da troca de folga.' });
      return;
    }

    setSalvando(true);
    try {
      await criarExcecao({
        tipo: 'troca_folga',
        funcionarioId: trocaFunc,
        dataInicio: trocaData,
        dataFim: trocaData,
        novoEstado: trocaEstado,
        motivo: trocaMotivo,
        nomeAfetado: nomes[trocaFunc],
        nomes,
      });
      setTrocaMotivo('');
      setFeedback({ tipo: 'ok', texto: 'Troca de folga registrada e sincronizada.' });
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao registrar troca.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarAusencia(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!ausenciaInicio || !ausenciaFim || ausenciaInicio > ausenciaFim) {
      setFeedback({ tipo: 'erro', texto: 'A data final deve ser igual ou posterior à inicial.' });
      return;
    }
    if (!ausenciaMotivo.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe o motivo da ausência.' });
      return;
    }

    setSalvando(true);
    try {
      await criarExcecao({
        tipo: 'ausencia',
        funcionarioId: ausenciaFunc,
        dataInicio: ausenciaInicio,
        dataFim: ausenciaFim,
        motivo: ausenciaMotivo,
        nomeAfetado: nomes[ausenciaFunc],
        nomes,
      });
      setAusenciaMotivo('');
      setFeedback({ tipo: 'ok', texto: 'Ausência registrada com sucesso.' });
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao registrar ausência.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarLojaFechada(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (!fechadaInicio || !fechadaFim || fechadaInicio > fechadaFim) {
      setFeedback({ tipo: 'erro', texto: 'A data final deve ser igual ou posterior à inicial.' });
      return;
    }

    setSalvando(true);
    try {
      await criarExcecao({
        tipo: 'loja_fechada',
        funcionarioId: '',
        dataInicio: fechadaInicio,
        dataFim: fechadaFim,
        motivo: fechadaMotivo.trim() || 'Feriado / Loja fechada',
        nomeAfetado: 'Loja inteira',
        nomes,
      });
      setFechadaMotivo('');
      setFeedback({ tipo: 'ok', texto: 'Dia de loja fechada registrado.' });
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao registrar feriado.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleSalvarNomes(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSalvando(true);
    try {
      await salvarNomesEquipe(nomesForm, nomes);
      setFeedback({ tipo: 'ok', texto: 'Nomes da equipe atualizados para todos.' });
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao atualizar nomes.',
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemoverExcecao(item: Excecao) {
    setFeedback(null);
    setSalvando(true);
    try {
      await removerExcecao(item, excecoes, nomes);
      if (feriasEditando?.id === item.id) {
        cancelarEdicaoFerias();
      }
      if (ajusteCobId === item.id) {
        setAjusteCobId(null);
      }
      setFeedback({ tipo: 'ok', texto: 'Registro removido com sucesso.' });
    } catch (err) {
      setFeedback({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Erro ao remover registro.',
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="stack-md" aria-label="Painel do gerente">
      <div className="card-superficie row-between">
        <div className="segmented-bar" role="tablist" aria-label="Seções do gerente">
          <button
            type="button"
            role="tab"
            aria-selected={abaInterna === 'gestao'}
            className={`segmented-btn ${abaInterna === 'gestao' ? 'ativo' : ''}`}
            onClick={() => setAbaInterna('gestao')}
          >
            Gestão
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={abaInterna === 'testes'}
            className={`segmented-btn ${abaInterna === 'testes' ? 'ativo' : ''}`}
            onClick={() => setAbaInterna('testes')}
          >
            Testes (Seção 8)
          </button>
        </div>

        <button type="button" className="btn-secundario" onClick={onBloquear}>
          <Lock size={16} />
          Bloquear
        </button>
      </div>

      {abaInterna === 'testes' ? (
        <TestesSecao8View />
      ) : (
        <>
          {/* Alertas não bloqueantes em âmbar (#F9A825) */}
          {alertas.length > 0 && (
            <div className="card-superficie stack-sm">
              <h2 className="titulo-equipe">
                <span>Alertas da escala ({alertas.length})</span>
              </h2>
              {alertas.map((alerta) => (
                <div key={alerta.id} className="caixa-alerta-ambar" role="alert">
                  <AlertTriangle size={20} className="icone-alerta-ambar" />
                  <div className="w-full-lista">
                    <p className="alerta-titulo">{alerta.titulo}</p>
                    <p className="alerta-texto">{alerta.mensagem}</p>
                    {(alerta.tipo === 'sem_vendedor' || alerta.tipo === 'horario_descoberto') &&
                      alerta.intervalo && (
                        <button
                          type="button"
                          className="btn-alerta-cobrir"
                          disabled={salvando}
                          onClick={() => handleCobrirAlertaComJoao(alerta)}
                        >
                          Cobrir com {nomes.gerente1} ({alerta.intervalo.texto})
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seletor de ação */}
          <div className="card-superficie stack-sm">
            <h1 className="titulo-secao">Ações do gerente</h1>
            <div className="gerente-acoes-grid">
              <button
                type="button"
                className={formAtivo === 'ferias' ? 'btn-primario' : 'btn-secundario'}
                onClick={() => {
                  setFormAtivo('ferias');
                  setFeedback(null);
                }}
              >
                <Palmtree size={18} />
                Registrar férias
              </button>
              <button
                type="button"
                className={formAtivo === 'cobertura' ? 'btn-primario' : 'btn-secundario'}
                onClick={() => {
                  setFormAtivo('cobertura');
                  setFeedback(null);
                }}
              >
                <ShieldPlus size={18} />
                Cobertura vendas
              </button>
              <button
                type="button"
                className={formAtivo === 'troca' ? 'btn-primario' : 'btn-secundario'}
                onClick={() => {
                  setFormAtivo('troca');
                  setFeedback(null);
                }}
              >
                <RefreshCw size={18} />
                Trocar folga
              </button>
              <button
                type="button"
                className={formAtivo === 'ausencia' ? 'btn-primario' : 'btn-secundario'}
                onClick={() => {
                  setFormAtivo('ausencia');
                  setFeedback(null);
                }}
              >
                <CalendarOff size={18} />
                Registrar ausência
              </button>
            </div>

            <div className="row-gap-sm">
              <button
                type="button"
                className={formAtivo === 'loja_fechada' ? 'btn-primario' : 'btn-secundario'}
                onClick={() => {
                  setFormAtivo('loja_fechada');
                  setFeedback(null);
                }}
              >
                <Lock size={18} />
                Loja fechada
              </button>
              <button
                type="button"
                className={formAtivo === 'nomes' ? 'btn-primario' : 'btn-secundario'}
                onClick={() => {
                  setFormAtivo('nomes');
                  setNomesForm({ ...nomes });
                  setFeedback(null);
                }}
              >
                <Users size={18} />
                Editar nomes dos funcionários
              </button>
            </div>

            {feedback && (
              <div className={feedback.tipo === 'erro' ? 'erro-inline' : 'retorno-preview'}>
                {feedback.texto}
              </div>
            )}

            <hr className="divisor-madeira" />

            {/* Formulário: Registrar / Editar Férias */}
            {formAtivo === 'ferias' && (
              <form className="stack-md" onSubmit={handleSalvarFerias}>
                <div className="row-between">
                  <h2 className="titulo-equipe">
                    {feriasEditando ? 'Editar férias' : 'Registrar férias'}
                  </h2>
                  {feriasEditando && (
                    <button
                      type="button"
                      className="btn-secundario"
                      onClick={cancelarEdicaoFerias}
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                <div className="form-grid form-grid-2">
                  <div className="campo-grupo">
                    <label htmlFor="ferias-func" className="campo-label">
                      Funcionário
                    </label>
                    <select
                      id="ferias-func"
                      className="campo-select"
                      value={feriasFunc}
                      onChange={(e) => {
                        setFeriasFunc(e.target.value as FuncionarioId);
                        setFeriasQuemCobre('');
                      }}
                    >
                      {FUNCIONARIOS_LISTA.map((f) => (
                        <option key={f.id} value={f.id}>
                          {nomes[f.id]} ({f.equipe})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="ferias-cobre" className="campo-label">
                      Quem cobre
                    </label>
                    <select
                      id="ferias-cobre"
                      className="campo-select"
                      value={feriasQuemCobre}
                      onChange={(e) => setFeriasQuemCobre(e.target.value)}
                    >
                      <option value="">Ninguém</option>
                      <option value="gerente1">{nomes.gerente1} (Gerência)</option>
                      <option value={outroColegaId}>
                        {nomes[outroColegaId]} (outro integrante)
                      </option>
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="ferias-inicio" className="campo-label">
                      Data de início
                    </label>
                    <input
                      id="ferias-inicio"
                      type="date"
                      className="campo-input"
                      value={feriasInicio}
                      onChange={(e) => setFeriasInicio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="ferias-fim" className="campo-label">
                      Data de fim
                    </label>
                    <input
                      id="ferias-fim"
                      type="date"
                      className="campo-input"
                      value={feriasFim}
                      onChange={(e) => setFeriasFim(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="campo-grupo">
                  <label htmlFor="ferias-motivo" className="campo-label">
                    Observação / motivo (opcional)
                  </label>
                  <input
                    id="ferias-motivo"
                    type="text"
                    maxLength={200}
                    className="campo-input"
                    value={feriasMotivo}
                    onChange={(e) => setFeriasMotivo(e.target.value)}
                    placeholder="Ex.: Férias anuais"
                  />
                </div>

                {retornoPrevisto && (
                  <div className="retorno-preview tabular-nums">
                    Data de retorno pela escala: {formatarDataBR(retornoPrevisto)} (volta em{' '}
                    {formatarDiaMesBR(retornoPrevisto)})
                  </div>
                )}

                <button type="submit" className="btn-primario" disabled={salvando}>
                  {feriasEditando ? 'Salvar alterações das férias' : 'Confirmar registro de férias'}
                </button>
              </form>
            )}

            {/* Formulário: Registrar Cobertura */}
            {formAtivo === 'cobertura' && (
              <form className="stack-md" onSubmit={handleSalvarCoberturaManual}>
                <h2 className="titulo-equipe">Registrar cobertura</h2>
                <div className="form-grid form-grid-2">
                  <div className="campo-grupo">
                    <label htmlFor="cob-por" className="campo-label">
                      Quem cobre
                    </label>
                    <select
                      id="cob-por"
                      className="campo-select"
                      value={cobPorId}
                      onChange={(e) => setCobPorId(e.target.value as PessoaId)}
                    >
                      <option value="gerente1">{nomes.gerente1} (Gerência)</option>
                      <option value="vendedor1">{nomes.vendedor1} (Vendedores)</option>
                      <option value="vendedor2">{nomes.vendedor2} (Vendedores)</option>
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="cob-alvo" className="campo-label">
                      No lugar de quem
                    </label>
                    <select
                      id="cob-alvo"
                      className="campo-select"
                      value={cobAlvoId}
                      onChange={(e) => setCobAlvoId(e.target.value as FuncionarioId)}
                    >
                      {FUNCIONARIOS_LISTA.map((f) => (
                        <option key={f.id} value={f.id}>
                          {nomes[f.id]} ({f.equipe})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="cob-inicio" className="campo-label">
                      Data inicial
                    </label>
                    <input
                      id="cob-inicio"
                      type="date"
                      className="campo-input"
                      value={cobInicio}
                      onChange={(e) => setCobInicio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="cob-fim" className="campo-label">
                      Data final
                    </label>
                    <input
                      id="cob-fim"
                      type="date"
                      className="campo-input"
                      value={cobFim}
                      onChange={(e) => setCobFim(e.target.value)}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="cob-modo" className="campo-label">
                      Modo
                    </label>
                    <select
                      id="cob-modo"
                      className="campo-select"
                      value={cobModo}
                      onChange={(e) => setCobModo(e.target.value as Exclude<ModoCobertura, ''>)}
                    >
                      <option value="turno_completo">Turno completo da regra base</option>
                      <option value="faixa">Faixa específica de horário</option>
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="cob-motivo" className="campo-label">
                      Motivo
                    </label>
                    <input
                      id="cob-motivo"
                      type="text"
                      maxLength={200}
                      className="campo-input"
                      value={cobMotivo}
                      onChange={(e) => setCobMotivo(e.target.value)}
                      placeholder="Ex.: gerente cobre"
                    />
                  </div>

                  {cobModo === 'faixa' && (
                    <>
                      <div className="campo-grupo">
                        <label htmlFor="cob-hini" className="campo-label">
                          Hora início
                        </label>
                        <input
                          id="cob-hini"
                          type="time"
                          className="campo-input font-horario"
                          value={cobHoraIni}
                          onChange={(e) => setCobHoraIni(e.target.value)}
                          required
                        />
                      </div>

                      <div className="campo-grupo">
                        <label htmlFor="cob-hfim" className="campo-label">
                          Hora fim
                        </label>
                        <input
                          id="cob-hfim"
                          type="time"
                          className="campo-input font-horario"
                          value={cobHoraFim}
                          onChange={(e) => setCobHoraFim(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                <button type="submit" className="btn-primario" disabled={salvando}>
                  Salvar cobertura
                </button>
              </form>
            )}

            {/* Formulário: Trocar Folga */}
            {formAtivo === 'troca' && (
              <form className="stack-md" onSubmit={handleSalvarTroca}>
                <h2 className="titulo-equipe">Trocar folga</h2>
                <div className="form-grid form-grid-2">
                  <div className="campo-grupo">
                    <label htmlFor="troca-func" className="campo-label">
                      Funcionário
                    </label>
                    <select
                      id="troca-func"
                      className="campo-select"
                      value={trocaFunc}
                      onChange={(e) => setTrocaFunc(e.target.value as FuncionarioId)}
                    >
                      {FUNCIONARIOS_LISTA.map((f) => (
                        <option key={f.id} value={f.id}>
                          {nomes[f.id]} ({f.equipe})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="troca-data" className="campo-label">
                      Data
                    </label>
                    <input
                      id="troca-data"
                      type="date"
                      className="campo-input"
                      value={trocaData}
                      onChange={(e) => setTrocaData(e.target.value)}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="troca-estado" className="campo-label">
                      Novo estado
                    </label>
                    <select
                      id="troca-estado"
                      className="campo-select"
                      value={trocaEstado}
                      onChange={(e) => setTrocaEstado(e.target.value as NovoEstadoTroca)}
                    >
                      <option value="trabalha">Trabalha</option>
                      <option value="folga">Folga</option>
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="troca-motivo" className="campo-label">
                      Motivo
                    </label>
                    <input
                      id="troca-motivo"
                      type="text"
                      maxLength={200}
                      className="campo-input"
                      value={trocaMotivo}
                      onChange={(e) => setTrocaMotivo(e.target.value)}
                      placeholder="Ex.: Troca combinada / gerente cobre"
                      required
                    />
                  </div>
                </div>

                {conflitoTrocaFerias && (
                  <div className="caixa-alerta-ambar" role="alert">
                    <AlertTriangle size={20} className="icone-alerta-ambar" />
                    <div>
                      <p className="alerta-titulo">Troca bloqueada dentro das férias</p>
                      <p className="alerta-texto">
                        {nomes[trocaFunc]} está de férias de{' '}
                        {formatarDataBR(conflitoTrocaFerias.dataInicio)} a{' '}
                        {formatarDataBR(conflitoTrocaFerias.dataFim)}. Não é permitido criar troca de folga durante as férias da mesma pessoa.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primario"
                  disabled={salvando || Boolean(conflitoTrocaFerias)}
                >
                  Salvar troca de folga
                </button>
              </form>
            )}

            {/* Formulário: Ausência Comum */}
            {formAtivo === 'ausencia' && (
              <form className="stack-md" onSubmit={handleSalvarAusencia}>
                <h2 className="titulo-equipe">Registrar ausência por período</h2>
                <div className="form-grid form-grid-2">
                  <div className="campo-grupo">
                    <label htmlFor="ausencia-func" className="campo-label">
                      Funcionário
                    </label>
                    <select
                      id="ausencia-func"
                      className="campo-select"
                      value={ausenciaFunc}
                      onChange={(e) => setAusenciaFunc(e.target.value as FuncionarioId)}
                    >
                      {FUNCIONARIOS_LISTA.map((f) => (
                        <option key={f.id} value={f.id}>
                          {nomes[f.id]} ({f.equipe})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="ausencia-motivo" className="campo-label">
                      Motivo (atestado, licença, etc.)
                    </label>
                    <input
                      id="ausencia-motivo"
                      type="text"
                      maxLength={200}
                      className="campo-input"
                      value={ausenciaMotivo}
                      onChange={(e) => setAusenciaMotivo(e.target.value)}
                      placeholder="Ex.: Atestado médico"
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="ausencia-inicio" className="campo-label">
                      Data inicial
                    </label>
                    <input
                      id="ausencia-inicio"
                      type="date"
                      className="campo-input"
                      value={ausenciaInicio}
                      onChange={(e) => setAusenciaInicio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="ausencia-fim" className="campo-label">
                      Data final
                    </label>
                    <input
                      id="ausencia-fim"
                      type="date"
                      className="campo-input"
                      value={ausenciaFim}
                      onChange={(e) => setAusenciaFim(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primario" disabled={salvando}>
                  Salvar ausência
                </button>
              </form>
            )}

            {/* Formulário: Loja Fechada / Feriado */}
            {formAtivo === 'loja_fechada' && (
              <form className="stack-md" onSubmit={handleSalvarLojaFechada}>
                <h2 className="titulo-equipe">Marcar feriado ou loja fechada</h2>
                <div className="form-grid form-grid-2">
                  <div className="campo-grupo">
                    <label htmlFor="fechada-inicio" className="campo-label">
                      Data inicial
                    </label>
                    <input
                      id="fechada-inicio"
                      type="date"
                      className="campo-input"
                      value={fechadaInicio}
                      onChange={(e) => setFechadaInicio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="fechada-fim" className="campo-label">
                      Data final
                    </label>
                    <input
                      id="fechada-fim"
                      type="date"
                      className="campo-input"
                      value={fechadaFim}
                      onChange={(e) => setFechadaFim(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="campo-grupo">
                  <label htmlFor="fechada-motivo" className="campo-label">
                    Motivo / feriado
                  </label>
                  <input
                    id="fechada-motivo"
                    type="text"
                    maxLength={200}
                    className="campo-input"
                    value={fechadaMotivo}
                    onChange={(e) => setFechadaMotivo(e.target.value)}
                    placeholder="Ex.: Feriado nacional"
                  />
                </div>

                <button type="submit" className="btn-primario" disabled={salvando}>
                  Confirmar loja fechada
                </button>
              </form>
            )}

            {/* Formulário: Editar Nomes */}
            {formAtivo === 'nomes' && (
              <form className="stack-md" onSubmit={handleSalvarNomes}>
                <h2 className="titulo-equipe">Editar nomes dos funcionários</h2>
                <div className="form-grid form-grid-2">
                  <div className="campo-grupo">
                    <label htmlFor="nome-v1" className="campo-label">
                      Vendedores · Funcionário 1 (manhã)
                    </label>
                    <input
                      id="nome-v1"
                      type="text"
                      maxLength={60}
                      className="campo-input"
                      value={nomesForm.vendedor1}
                      onChange={(e) =>
                        setNomesForm((prev) => ({ ...prev, vendedor1: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="nome-v2" className="campo-label">
                      Vendedores · Funcionário 2 (tarde)
                    </label>
                    <input
                      id="nome-v2"
                      type="text"
                      maxLength={60}
                      className="campo-input"
                      value={nomesForm.vendedor2}
                      onChange={(e) =>
                        setNomesForm((prev) => ({ ...prev, vendedor2: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="nome-a1" className="campo-label">
                      Administrativo · Funcionário 1
                    </label>
                    <input
                      id="nome-a1"
                      type="text"
                      maxLength={60}
                      className="campo-input"
                      value={nomesForm.admin1}
                      onChange={(e) =>
                        setNomesForm((prev) => ({ ...prev, admin1: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="nome-a2" className="campo-label">
                      Administrativo · Funcionário 2
                    </label>
                    <input
                      id="nome-a2"
                      type="text"
                      maxLength={60}
                      className="campo-input"
                      value={nomesForm.admin2}
                      onChange={(e) =>
                        setNomesForm((prev) => ({ ...prev, admin2: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="nome-g1" className="campo-label">
                      Gerência · Integrante (gerente1)
                    </label>
                    <input
                      id="nome-g1"
                      type="text"
                      maxLength={60}
                      className="campo-input"
                      value={nomesForm.gerente1}
                      onChange={(e) =>
                        setNomesForm((prev) => ({ ...prev, gerente1: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primario" disabled={salvando}>
                  Salvar nomes para todos
                </button>
              </form>
            )}
          </div>

          {/* Lista de Férias cadastradas */}
          <div className="card-superficie stack-sm">
            <h2 className="titulo-equipe">
              <span>Férias registradas ({feriasLista.length})</span>
            </h2>
            {feriasLista.length === 0 ? (
              <p className="texto-suave">Nenhuma férias registrada.</p>
            ) : (
              <div className="lista-funcionarios">
                {feriasLista.map((item) => {
                  const nome = item.funcionarioId
                    ? resolverNomePessoa(item.funcionarioId, nomes)
                    : 'Funcionário';
                  const nomeCobertor = item.quemCobre
                    ? resolverNomePessoa(item.quemCobre as PessoaId, nomes)
                    : '';
                  const retorno =
                    item.funcionarioId && item.funcionarioId !== 'gerente1'
                      ? calcularDataRetornoFerias(
                          item.dataFim,
                          item.funcionarioId as FuncionarioId,
                          excecoes
                        )
                      : null;
                  return (
                    <div key={item.id} className="item-funcionario status-ferias">
                      <div className="item-funcionario-topo">
                        <span className="funcionario-nome">{nome}</span>
                        <span className="funcionario-rotulo-ferias">Férias</span>
                      </div>
                      <span className="funcionario-detalhe tabular-nums">
                        {formatarDataBR(item.dataInicio)} a {formatarDataBR(item.dataFim)}
                        {retorno ? ` · volta em ${formatarDiaMesBR(retorno)}` : ''}
                      </span>
                      {nomeCobertor && (
                        <span className="funcionario-detalhe">Coberto por: {nomeCobertor}</span>
                      )}
                      {item.motivo && (
                        <span className="funcionario-detalhe">Motivo: {item.motivo}</span>
                      )}
                      <div className="row-gap-sm">
                        <button
                          type="button"
                          className="btn-secundario"
                          onClick={() => iniciarEdicaoFerias(item)}
                        >
                          <Edit3 size={16} />
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-perigo-texto"
                          disabled={salvando}
                          onClick={() => handleRemoverExcecao(item)}
                        >
                          <Trash2 size={16} />
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de Coberturas registradas com ajuste de 1 dia */}
          <div className="card-superficie stack-sm">
            <h2 className="titulo-equipe">
              <span>Coberturas registradas ({coberturasLista.length})</span>
            </h2>
            {coberturasLista.length === 0 ? (
              <p className="texto-suave">Nenhuma cobertura registrada.</p>
            ) : (
              <div className="lista-funcionarios">
                {coberturasLista.map((cob) => {
                  const nomePor = resolverNomePessoa((cob.coberturaPorId || 'gerente1') as PessoaId, nomes);
                  const nomeAlvo = resolverNomePessoa(
                    (cob.cobreFuncionarioId || 'vendedor2') as PessoaId,
                    nomes
                  );
                  const periodo =
                    cob.dataInicio === cob.dataFim
                      ? formatarDataBR(cob.dataInicio)
                      : `${formatarDataBR(cob.dataInicio)} a ${formatarDataBR(cob.dataFim)}`;
                  const modoTexto =
                    cob.modo === 'faixa'
                      ? `Faixa ${cob.horaInicio} às ${cob.horaFim}`
                      : 'Turno completo';
                  const emAjuste = ajusteCobId === cob.id;

                  return (
                    <div key={cob.id} className="item-funcionario">
                      <div className="item-funcionario-topo">
                        <span className="funcionario-nome">
                          {nomePor} cobre {nomeAlvo}
                        </span>
                        <span className="selo-alterado">{modoTexto}</span>
                      </div>
                      <span className="funcionario-detalhe tabular-nums">
                        {periodo} · {cob.motivo || 'Cobertura'}
                        {cob.origemFeriasId ? ' · vinculada às férias' : ''}
                      </span>

                      <div className="row-gap-sm">
                        <button
                          type="button"
                          className="btn-secundario"
                          onClick={() => {
                            if (emAjuste) {
                              setAjusteCobId(null);
                            } else {
                              setAjusteCobId(cob.id);
                              setAjusteData(
                                cob.dataInicio < '2026-12-15' && cob.dataFim >= '2026-12-15'
                                  ? '2026-12-15'
                                  : cob.dataInicio
                              );
                              setAjusteAcao('remover');
                              setAjusteMotivo('');
                            }
                          }}
                        >
                          <Edit3 size={16} />
                          {emAjuste ? 'Fechar ajuste' : 'Ajustar 1 dia'}
                        </button>
                        <button
                          type="button"
                          className="btn-perigo-texto"
                          disabled={salvando}
                          onClick={() => handleRemoverExcecao(cob)}
                        >
                          <Trash2 size={16} />
                          Remover tudo
                        </button>
                      </div>

                      {emAjuste && (
                        <div className="card-superficie stack-sm">
                          <div className="form-grid form-grid-2">
                            <div className="campo-grupo">
                              <label htmlFor={`aj-data-${cob.id}`} className="campo-label">
                                Dia específico
                              </label>
                              <input
                                id={`aj-data-${cob.id}`}
                                type="date"
                                min={cob.dataInicio}
                                max={cob.dataFim}
                                className="campo-input"
                                value={ajusteData}
                                onChange={(e) => setAjusteData(e.target.value)}
                              />
                            </div>

                            <div className="campo-grupo">
                              <label htmlFor={`aj-acao-${cob.id}`} className="campo-label">
                                Ação no dia
                              </label>
                              <select
                                id={`aj-acao-${cob.id}`}
                                className="campo-select"
                                value={ajusteAcao}
                                onChange={(e) =>
                                  setAjusteAcao(e.target.value as 'remover' | 'faixa')
                                }
                              >
                                <option value="remover">Remover cobertura deste dia</option>
                                <option value="faixa">Trocar por uma faixa de horário</option>
                              </select>
                            </div>

                            {ajusteAcao === 'faixa' && (
                              <>
                                <div className="campo-grupo">
                                  <label htmlFor={`aj-hini-${cob.id}`} className="campo-label">
                                    Hora início
                                  </label>
                                  <input
                                    id={`aj-hini-${cob.id}`}
                                    type="time"
                                    className="campo-input font-horario"
                                    value={ajusteHoraIni}
                                    onChange={(e) => setAjusteHoraIni(e.target.value)}
                                  />
                                </div>

                                <div className="campo-grupo">
                                  <label htmlFor={`aj-hfim-${cob.id}`} className="campo-label">
                                    Hora fim
                                  </label>
                                  <input
                                    id={`aj-hfim-${cob.id}`}
                                    type="time"
                                    className="campo-input font-horario"
                                    value={ajusteHoraFim}
                                    onChange={(e) => setAjusteHoraFim(e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          <div className="campo-grupo">
                            <label htmlFor={`aj-motivo-${cob.id}`} className="campo-label">
                              Motivo
                            </label>
                            <input
                              id={`aj-motivo-${cob.id}`}
                              type="text"
                              maxLength={200}
                              className="campo-input"
                              value={ajusteMotivo}
                              onChange={(e) => setAjusteMotivo(e.target.value)}
                              placeholder="Ex.: Reunião externa / cobertura parcial"
                            />
                          </div>

                          <button
                            type="button"
                            className="btn-primario"
                            disabled={salvando}
                            onClick={() => handleAplicarAjusteUmDia(cob)}
                          >
                            Aplicar neste dia
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de Trocas, Ausências e Feriados */}
          <div className="card-superficie stack-sm">
            <h2 className="titulo-equipe">
              <span>Trocas, ausências e feriados ({outrasExcecoes.length})</span>
            </h2>
            {outrasExcecoes.length === 0 ? (
              <p className="texto-suave">Nenhuma outra exceção registrada.</p>
            ) : (
              <div className="lista-funcionarios">
                {outrasExcecoes.map((item) => {
                  const nome = item.funcionarioId
                    ? resolverNomePessoa(item.funcionarioId, nomes)
                    : 'Loja fechada';
                  const periodo =
                    item.dataInicio === item.dataFim
                      ? formatarDataBR(item.dataInicio)
                      : `${formatarDataBR(item.dataInicio)} a ${formatarDataBR(item.dataFim)}`;
                  const tipoTexto =
                    item.tipo === 'troca_folga'
                      ? `Troca (${item.novoEstado === 'trabalha' ? 'Trabalha' : 'Folga'})`
                      : item.tipo === 'ausencia'
                        ? 'Ausência'
                        : 'Loja fechada';

                  return (
                    <div key={item.id} className="item-funcionario">
                      <div className="item-funcionario-topo">
                        <span className="funcionario-nome">{nome}</span>
                        <span className="selo-alterado">{tipoTexto}</span>
                      </div>
                      <span className="funcionario-detalhe tabular-nums">
                        {periodo} · {item.motivo || 'Sem motivo'}
                      </span>
                      <div className="row-gap-sm">
                        <button
                          type="button"
                          className="btn-perigo-texto"
                          disabled={salvando}
                          onClick={() => handleRemoverExcecao(item)}
                        >
                          <Trash2 size={16} />
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Histórico de alterações */}
          <div className="card-superficie stack-sm">
            <h2 className="titulo-equipe">
              <span className="row-gap-sm">
                <History size={18} className="brand-icon" />
                Histórico de alterações ({historico.length})
              </span>
            </h2>
            {historico.length === 0 ? (
              <p className="texto-suave">
                As criações, edições e remoções feitas pelo gerente aparecerão aqui.
              </p>
            ) : (
              <div className="lista-funcionarios">
                {historico.map((h) => {
                  const dataRegistro = h.criadoEm
                    ? new Intl.DateTimeFormat('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(h.criadoEm))
                    : '';

                  return (
                    <div key={h.id} className="item-funcionario">
                      <div className="item-funcionario-topo">
                        <span className="funcionario-nome">
                          {labelAcao(h.acao)} · {labelCategoria(h.categoria)}
                        </span>
                        <span className="texto-suave tabular-nums">{dataRegistro}</span>
                      </div>
                      <span className="funcionario-detalhe">
                        <strong>Afetado:</strong> {h.afetado} · <strong>Período:</strong> {h.periodo}
                      </span>
                      <span className="funcionario-detalhe">
                        <strong>Motivo:</strong> {h.motivo} ({h.detalhes})
                      </span>
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
