# Especificação de Segurança — Escala da Loja

## Modelo de Acesso
- **Leitura aberta sem login**: Toda a equipe consulta a escala, nomes e exceções em tempo real no celular sem autenticação.
- **Escrita protegida por validação estrita de esquema + PIN no cliente**: Como especificado no documento do aplicativo, não há login de usuários; o acesso de edição é liberado por PIN simples no cliente e protegido no Firestore por validação estrita de tipos, chaves exatas (`hasAll` + `hasOnly`), regex de datas (`YYYY-MM-DD`), limites de tamanho e imutabilidade de histórico.

## Invariantes de Dados
1. Nenhum documento fora de `/config/equipe`, `/excecoes/{excecaoId}`, `/historico/{historicoId}` e `/test/connection` pode ser lido ou escrito.
2. IDs de documento devem respeitar `^[a-zA-Z0-9_\-]+$` e tamanho `<= 128`.
3. `Excecao` só aceita `tipo` em `['ferias', 'ausencia', 'troca_folga', 'loja_fechada']`, datas válidas `YYYY-MM-DD`, campos sem chaves extras ("shadow fields") e strings com limite rígido.
4. `HistoricoItem` é append-only (criação e leitura permitidas; atualização e exclusão bloqueadas).
5. `EquipeConfig` só permite o documento `equipe` e exige os 4 nomes não vazios (`1..60` chars).
