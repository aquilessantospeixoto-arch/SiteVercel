# PeixotoXzx Auth — Vercel + Neon

Sistema independente de licenças: painel admin, geração de keys, duração contada a partir do primeiro resgate, lifetime, HWID, revogação, exclusão e endpoints de ativação/validação.

## Publicar
1. Descompacte o ZIP e envie os arquivos a um repositório privado no GitHub.
2. Na Vercel, use **Add New > Project**, importe o repositório e selecione Next.js.
3. No Vercel Marketplace, conecte uma base **Neon Postgres** ao projeto. Configure a variável `DATABASE_URL` com a connection string fornecida (ou use a variável equivalente da integração renomeando-a para `DATABASE_URL`).
4. Em **Project > Settings > Environment Variables**, configure `ADMIN_PASSWORD` (mínimo 12 caracteres) e `SESSION_SECRET` (32+ caracteres aleatórios). Não use `NEXT_PUBLIC_` nessas variáveis.
5. Faça **Redeploy** depois de adicionar variáveis. Acesse `https://SEU-PROJETO.vercel.app/dashboard`. O banco cria a tabela automaticamente na primeira chamada autorizada.

Não precisa configurar DuckDNS para usar o endereço gratuito `*.vercel.app`. Um domínio externo é opcional.

## API do aplicativo C#

Ativar pela primeira vez (POST JSON `https://SEU-PROJETO.vercel.app/api/redeem`):
```json
{"key":"PX-EXEMPLO-12345678","hwid":"IDENTIFICADOR-ESTAVEL-DO-COMPUTADOR"}
```
Resposta válida: `{ "ok": true, "expires_at": "..." , "lifetime": false }`.

Validar a cada inicialização (POST JSON `/api/validate`):
```json
{"key":"PX-EXEMPLO-12345678","hwid":"IDENTIFICADOR-ESTAVEL-DO-COMPUTADOR"}
```
Resposta: `{ "valid": true, "expires_at": "..." }` ou `{ "valid": false }`.

**Importante:** utilize HTTPS; não inclua `ADMIN_PASSWORD`, `DATABASE_URL`, ou `SESSION_SECRET` no cliente C#. Use um HWID estável, sem enviar dados pessoais desnecessários. A API protege dados por consulta parametrizada e hash HMAC. Como qualquer software executado pelo usuário, o cliente pode ser adulterado; a verificação no servidor é a fonte de verdade.

## Desenvolvimento local
`npm install` e `npm run dev`, com `.env.local` configurado. Requer Node.js 20+.

## Limitações de produção
- O endpoint de resgate/validação precisa de rate limiting (por exemplo, WAF/CDN ou Redis) antes de disponibilização pública ampla.
- Este projeto é uma base funcional inicial, não um serviço auditado de segurança.
- A listagem do painel mostra as 500 keys mais recentes.
- O plano gratuito dos provedores pode possuir cotas e limites próprios.


## Recursos adicionais (v2)

- Keys automáticas: `PXZX-Spoofer-Semanal-<24 caracteres hex>`; nomes disponíveis: Diaria, Semanal, Quinzenal, Mensal, Trimestral, Semestral, Anual e Lifetime.
- Painel **Usuários e banimentos**: conta, total de licenças, última ativação, motivo do ban e desbanimento.
- Tabela de licenças: nome de usuário, IP capturado na primeira ativação e data/hora da ativação.
- Para associar usuário à primeira ativação, o cliente deve enviar `username` junto de `key` e `hwid` no POST `/api/redeem`. Exemplo: `{"key":"PXZX-Spoofer-Semanal-...", "hwid":"identificador-do-dispositivo", "username":"cliente123"}`. Se o cliente antigo omitir `username`, a ativação ainda funciona mas exibirá "Não informado" até a integração cliente ser atualizada.
- O endpoint `/api/validate` invalida uma licença quando sua conta vinculada estiver banida.
- O banco é atualizado automaticamente no primeiro acesso a uma rota que use `setup()`. Requer DATABASE_URL do Neon. Configure também SESSION_SECRET e ADMIN_PASSWORD na Vercel; faça redeploy após adicioná-las.

### Privacidade e limitações

O endereço IP é dado pessoal. Antes de coletá-lo, informe aos clientes finalidade, acesso restrito e período de retenção conforme a LGPD. Os IPs não são um identificador confiável de pessoa ou máquina; podem mudar e ser compartilhados. `username` é um identificador declarado pelo cliente, não uma identidade autenticada: para impedir usurpação de nomes em produção, implemente login seguro/autenticação de contas. O banimento baseado na conta vinculada às licenças impede validação, mas não substitui autenticação de usuário. Evite armazenar IP por tempo indefinido.
