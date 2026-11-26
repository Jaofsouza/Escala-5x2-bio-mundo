import { CalendarDays, CalendarRange, ShieldCheck, Store, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GerenteView } from './components/GerenteView';
import { HojeView } from './components/HojeView';
import { MinhaEscalaView } from './components/MinhaEscalaView';
import { SemanaView } from './components/SemanaView';
import { NOMES_PADRAO_COMPLETOS } from './cobertura.js';
import { DATA_INICIO_NOVA_ESCALA, obterHojeSaoPaulo } from './escala.js';
import {
  inicializarDadosIniciaisFirestore,
  observarEquipe,
  observarExcecoes,
  observarHistorico,
} from './store/escalaStore';
import type { Excecao, HistoricoItem, NomesEquipe } from './types';

// Altere aqui o PIN simples para liberar a aba do gerente
const PIN_GERENTE = '1234';

type AbaPrincipal = 'hoje' | 'semana' | 'minha' | 'gerente';

function AppConteudo() {
  const [abaAtiva, setAbaAtiva] = useState<AbaPrincipal>('hoje');
  const [dataHojeView, setDataHojeView] = useState<string>(() => obterHojeSaoPaulo());
  const [dataSemanaView, setDataSemanaView] = useState<string>(() => {
    const hoje = obterHojeSaoPaulo();
    return hoje < DATA_INICIO_NOVA_ESCALA ? DATA_INICIO_NOVA_ESCALA : hoje;
  });

  const [gerenteDesbloqueado, setGerenteDesbloqueado] = useState(false);
  const [nomes, setNomes] = useState<NomesEquipe>({ ...NOMES_PADRAO_COMPLETOS });
  const [excecoes, setExcecoes] = useState<Excecao[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFirestore, setErroFirestore] = useState<Error | null>(null);

  if (erroFirestore) {
    throw erroFirestore;
  }

  useEffect(() => {
    let ativo = true;

    inicializarDadosIniciaisFirestore()
      .catch((err) => {
        if (ativo) {
          setErroFirestore(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    const unsubEquipe = observarEquipe(
      (novosNomes) => {
        if (ativo) setNomes(novosNomes);
      },
      (err) => {
        if (ativo) setErroFirestore(err);
      }
    );

    const unsubExcecoes = observarExcecoes(
      (lista) => {
        if (ativo) setExcecoes(lista);
      },
      (err) => {
        if (ativo) setErroFirestore(err);
      }
    );

    const unsubHistorico = observarHistorico(
      (lista) => {
        if (ativo) setHistorico(lista);
      },
      (err) => {
        if (ativo) setErroFirestore(err);
      }
    );

    return () => {
      ativo = false;
      unsubEquipe();
      unsubExcecoes();
      unsubHistorico();
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <Store size={20} className="brand-icon" />
            <span>Escala da Loja</span>
          </div>

          <nav className="desktop-nav" aria-label="Navegação principal">
            <button
              type="button"
              className={`desktop-nav-btn ${abaAtiva === 'hoje' ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva('hoje')}
            >
              Hoje
            </button>
            <button
              type="button"
              className={`desktop-nav-btn ${abaAtiva === 'semana' ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva('semana')}
            >
              Semana
            </button>
            <button
              type="button"
              className={`desktop-nav-btn ${abaAtiva === 'minha' ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva('minha')}
            >
              Minha Escala
            </button>
            <button
              type="button"
              className={`desktop-nav-btn ${abaAtiva === 'gerente' ? 'ativo' : ''}`}
              onClick={() => setAbaAtiva('gerente')}
            >
              Gerente
            </button>
          </nav>

          <button
            type="button"
            className="topbar-action-btn"
            onClick={() => {
              setDataHojeView(DATA_INICIO_NOVA_ESCALA);
              setAbaAtiva('hoje');
            }}
          >
            Início 15/12
          </button>
        </div>
      </header>

      <main className="main-container">
        {carregando ? (
          <div className="card-superficie">
            <p className="texto-suave">Sincronizando escala da loja...</p>
          </div>
        ) : (
          <>
            {abaAtiva === 'hoje' && (
              <HojeView
                dataSelecionada={dataHojeView}
                onChangeData={setDataHojeView}
                excecoes={excecoes}
                nomes={nomes}
              />
            )}
            {abaAtiva === 'semana' && (
              <SemanaView
                dataReferencia={dataSemanaView}
                onChangeDataReferencia={setDataSemanaView}
                excecoes={excecoes}
                nomes={nomes}
              />
            )}
            {abaAtiva === 'minha' && (
              <MinhaEscalaView excecoes={excecoes} nomes={nomes} />
            )}
            {abaAtiva === 'gerente' && (
              <GerenteView
                pinGerente={PIN_GERENTE}
                desbloqueado={gerenteDesbloqueado}
                onDesbloquear={() => setGerenteDesbloqueado(true)}
                onBloquear={() => setGerenteDesbloqueado(false)}
                excecoes={excecoes}
                historico={historico}
                nomes={nomes}
              />
            )}
          </>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Abas inferiores">
        <button
          type="button"
          className={`bottom-nav-btn ${abaAtiva === 'hoje' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('hoje')}
        >
          <CalendarDays size={22} />
          <span>Hoje</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${abaAtiva === 'semana' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('semana')}
        >
          <CalendarRange size={22} />
          <span>Semana</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${abaAtiva === 'minha' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('minha')}
        >
          <UserCheck size={22} />
          <span>Minha Escala</span>
        </button>
        <button
          type="button"
          className={`bottom-nav-btn ${abaAtiva === 'gerente' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('gerente')}
        >
          <ShieldCheck size={22} />
          <span>Gerente</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppConteudo />
    </ErrorBoundary>
  );
}
