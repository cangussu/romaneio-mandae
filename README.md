# Romaneio Mandae

Extensão do Chrome para gerar o romaneio para entregas do Mandae.

## Problema

O sistem do Mandae não possui a funcionalidade para gerar o documento de
romaneio para uma ordem de serviço.

## Sobre a extensão

Os seguintes recursos do Google Chrome foram utilizados:

- content script: coleta dados da página web aberta
- background service: lida com o botão da extensão e comunicação com outros
- sandbox: é onde acessamos as APIs do Google
- offscreen: torna a página sandbox invisível (só precisamos dela para contornar
  as limitações de segurança, não para exibir informações ao usuário.)

### Fluxo de informações

Esta extensão irá coletar algumas informações de uma página web e enviá-las para uma
planilha. O fluxo de informações através dos componentes é assim:

0. O usuário inicia o fluxo clicando no ícone da extensão
1. O background service detecta o clique e injeta o content script na aba correta
2. O content script coleta os dados na aba e envia uma mensagem para o background service
3. O background service encaminha a mensagem para o documento offscreen
4. O documento offscreen encaminha a mensagem para o documento do iframe interno, o sandbox
5. O documento sandbox envia as informações para o destino final, uma planilha do Google.