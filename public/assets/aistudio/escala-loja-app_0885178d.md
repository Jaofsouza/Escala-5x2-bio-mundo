# App "Escala da Loja"

Aplicativo para a equipe de uma loja ver, de forma simples, quem trabalha e quem folga em cada dia. O gerente pode trocar folgas e registrar ausências, e toda alteração aparece para todos.

Tudo neste documento está fechado. Não invente horários, nomes nem regras que não estejam aqui.

## 1. Como será usado

- Uso interno, quase sempre no celular. Interface pensada para tela pequena, letras grandes, poucos toques.
- Idioma: português do Brasil. Datas no formato dd/mm/aaaa. Semana começa na segunda-feira. Fuso: America/Sao_Paulo.
- Todos veem a escala sem login. Só o gerente altera, com um PIN.
- O PIN pode ficar simples e visível no código. Serve só para a equipe não mexer sem querer.
- As alterações do gerente precisam aparecer para todos os celulares. Por isso o app precisa de armazenamento compartilhado (por exemplo Firebase Firestore, Supabase ou Vercel KV). Guardar só no navegador não serve.
- CSS em arquivo separado do HTML ou JSX, não inline.

## 2. A loja

- Funciona de segunda a sábado, das 08:30 às 19:30.
- Domingo a loja fica fechada.
- Almoço de 1h para todos.

## 3. Quem trabalha

Duas equipes, cada uma com dois funcionários que se revezam. Os nomes devem poder ser editados pelo gerente.

| Equipe | Funcionário 1 | Funcionário 2 |
|---|---|---|
| Vendedores | Thiago (turno manhã) | Lucas (turno tarde) |
| Administrativo | Murillo | Maria |

## 4. Regra do revezamento

Existem duas escalas, ambas com 5 dias de trabalho e 2 de folga:

- **Escala A:** trabalha de segunda a sexta. Folga sábado e domingo.
- **Escala B:** trabalha de terça a sábado. Folga domingo e segunda.

Em cada equipe, um funcionário fica na escala A e o outro na B. A cada semana eles trocam de escala. Domingo é folga para todos, sempre.

Início da nova escala: terça-feira 15/12/2026. A semana 1 é de 14/12/2026 a 20/12/2026, e a segunda 14/12 ainda é do regime antigo, então o app só mostra a escala nova a partir de 15/12/2026.

Semana n (n começa em 0 na semana de 14/12/2026):

- n par: o funcionário 1 de cada equipe está na escala A, e o funcionário 2 na B.
- n ímpar: o funcionário 1 está na escala B, e o funcionário 2 na A.

O app deve calcular isso a partir da data, sem cadastrar a escala dia a dia. Só as exceções (seção 7) ficam gravadas.

Exemplo das primeiras semanas:

| Semana | Período | Thiago | Lucas | Murillo | Maria |
|---|---|---|---|---|---|
| 1 | 14/12 a 20/12 | A (seg a sex) | B (ter a sáb) | A | B |
| 2 | 21/12 a 27/12 | B | A | B | A |
| 3 | 28/12 a 03/01 | A | B | A | B |
| 4 | 04/01 a 10/01 | B | A | B | A |

## 5. Horários

### Vendedores (42h por semana)

De terça a sexta os dois vendedores trabalham juntos:

- Thiago: 08:30 às 17:30 (8h trabalhadas)
- Lucas: 10:30 às 19:30 (8h trabalhadas)

Na segunda-feira só trabalha quem está na escala A, e no sábado só quem está na escala B. Esse vendedor trabalha sozinho entre os vendedores, abre e fecha a loja:

- Segunda e sábado: 08:30 às 19:30 (10h trabalhadas), seja quem for.

### Administrativo (42h por semana)

Todos os dias de trabalho, para os dois: 08:30 às 17:54 (8h24 trabalhadas).

O administrativo nunca abre a loja sozinho: o vendedor também entra às 08:30.

## 6. Telas

### Hoje (tela inicial)

- Data de hoje e o dia da semana.
- Quem trabalha hoje e o horário de cada um, em cartões separados por equipe.
- Quem folga hoje.
- Aviso quando só há um vendedor trabalhando (segunda e sábado) e o horário a partir do qual ele fica sozinho na loja, que é depois da saída do administrativo (17:54).
- Domingo mostra "Loja fechada".
- Botões para ver ontem e amanhã.

### Semana

- Grade com os 7 dias e as 4 pessoas.
- Cada célula mostra "Trabalha" com o horário ou "Folga".
- Folgas em verde. A semana atual destacada.
- Navegar para a semana anterior e a próxima.

### Minha escala

- O usuário escolhe o nome (4 opções) e o app guarda a escolha no aparelho.
- Calendário do mês com os dias de folga marcados.
- Mostra também a escala (A ou B) de cada semana e as horas da semana.

### Gerente (protegida por PIN)

- Entrar com o PIN.
- Trocar folga: escolher funcionário, data e o novo estado (trabalha ou folga), com um campo de motivo.
- Registrar ausência por período (férias, atestado): funcionário, data inicial, data final, motivo.
- Marcar feriados e dias em que a loja fecha.
- Editar os nomes dos funcionários.
- Histórico de todas as alterações, com data, quem foi afetado e motivo.
- Aviso (sem bloquear) quando uma alteração deixar algum dia sem vendedor, passar uma pessoa de 42h na semana ou deixar alguém com mais de 5 dias seguidos de trabalho.

## 7. Exceções

Uma exceção sobrepõe a regra de revezamento naquele dia. Tipos:

- Troca de folga (trabalha no dia que seria folga, ou folga no dia que seria de trabalho).
- Ausência por período (férias, atestado).
- Loja fechada (feriado).

Quando uma exceção estiver ativa, as telas mostram um selo "alterado" com o motivo.

### Ausências já conhecidas (conferir antes de usar)

- Lucas de férias de 01/12/2026 a 30/12/2026, volta em 02/01/2027. O gerente cobre o dia 31/12.
- Thiago de férias de 04/01/2027 a 02/02/2027, volta em 03/02/2027.
- Loja fechada em 01/01/2027.

## 8. Casos de teste (sem considerar as ausências da seção 7)

- Terça 15/12/2026: Thiago trabalha 08:30 às 17:30. Lucas trabalha 10:30 às 19:30. Murillo e Maria trabalham 08:30 às 17:54.
- Sábado 19/12/2026: Lucas trabalha sozinho entre os vendedores, 08:30 às 19:30. Thiago folga. Maria trabalha 08:30 às 17:54. Murillo folga.
- Segunda 21/12/2026: Lucas trabalha sozinho entre os vendedores, 08:30 às 19:30. Thiago folga. Maria trabalha. Murillo folga.
- Domingo 20/12/2026: todos folgam e a loja está fechada.
- Cada pessoa trabalha 5 dias por semana e soma 42h na semana.
