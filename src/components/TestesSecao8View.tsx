import { CheckCircle2, Play, XCircle } from 'lucide-react';
import { useState } from 'react';
import { executarTestesCobertura } from '../cobertura.js';
import { executarTestesSecao8 } from '../escala.js';
import type { ResumoTestesSecao8 } from '../types';

export function TestesSecao8View() {
  const [resumoBase, setResumoBase] = useState<ResumoTestesSecao8>(() => executarTestesSecao8());
  const [resumoCobertura, setResumoCobertura] = useState<ResumoTestesSecao8>(() =>
    executarTestesCobertura()
  );

  function rodarNovamente() {
    setResumoBase(executarTestesSecao8());
    setResumoCobertura(executarTestesCobertura());
  }

  const totalGeral = resumoBase.total + resumoCobertura.total;
  const aprovadosGeral = resumoBase.aprovados + resumoCobertura.aprovados;

  return (
    <div className="stack-md">
      <div className="card-superficie stack-sm">
        <div className="row-between">
          <div>
            <h2 className="titulo-equipe">Suíte de Testes (funções puras)</h2>
            <p className="texto-suave">
              Datas fixas sem depender do aparelho: Seção 8 (sem exceções) e Cobertura/Gerência (com exceções pré-cadastradas).
            </p>
          </div>
          <button type="button" className="btn-primario" onClick={rodarNovamente}>
            <Play size={16} />
            Rodar testes
          </button>
        </div>

        <hr className="divisor-madeira" />

        <div className="row-between">
          <strong className="funcionario-nome tabular-nums">
            Total geral: {aprovadosGeral} de {totalGeral} casos OK
          </strong>
          {aprovadosGeral === totalGeral ? (
            <span className="teste-badge-ok">
              <CheckCircle2 size={18} />
              Todos OK
            </span>
          ) : (
            <span className="teste-badge-erro">
              <XCircle size={18} />
              Há falhas
            </span>
          )}
        </div>
      </div>

      {/* Grupo 1: Seção 8 */}
      <div className="card-superficie stack-sm">
        <div className="row-between">
          <h3 className="titulo-equipe">Seção 8 — Escala base (sem exceções)</h3>
          <span className="texto-suave tabular-nums">
            {resumoBase.aprovados}/{resumoBase.total} OK
          </span>
        </div>

        <div className="stack-sm">
          {resumoBase.resultados.map((item) => (
            <div key={item.id} className="teste-item">
              <div className="row-between">
                <strong className="funcionario-nome">{item.titulo}</strong>
                {item.ok ? (
                  <span className="teste-badge-ok">
                    <CheckCircle2 size={18} />
                    OK
                  </span>
                ) : (
                  <span className="teste-badge-erro">
                    <XCircle size={18} />
                    Erro
                  </span>
                )}
              </div>
              <div className="texto-suave">
                <strong>Esperado:</strong> {item.esperado}
              </div>
              <div className="texto-suave tabular-nums">
                <strong>Obtido:</strong> {item.obtido}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grupo 2: Novos testes de Cobertura & Gerência */}
      <div className="card-superficie stack-sm">
        <div className="row-between">
          <h3 className="titulo-equipe">Cobertura e Gerência (com exceções pré-cadastradas)</h3>
          <span className="texto-suave tabular-nums">
            {resumoCobertura.aprovados}/{resumoCobertura.total} OK
          </span>
        </div>

        <div className="stack-sm">
          {resumoCobertura.resultados.map((item) => (
            <div key={item.id} className="teste-item">
              <div className="row-between">
                <strong className="funcionario-nome">{item.titulo}</strong>
                {item.ok ? (
                  <span className="teste-badge-ok">
                    <CheckCircle2 size={18} />
                    OK
                  </span>
                ) : (
                  <span className="teste-badge-erro">
                    <XCircle size={18} />
                    Erro
                  </span>
                )}
              </div>
              <div className="texto-suave">
                <strong>Esperado:</strong> {item.esperado}
              </div>
              <div className="texto-suave tabular-nums">
                <strong>Obtido:</strong> {item.obtido}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
