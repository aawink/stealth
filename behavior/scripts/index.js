'use strict'

exports.handle = (client) => {
  // Create steps
  const collectTicker = client.createStep({
      extractInfo() {
        let ticker = firstOfEntityRole(client.getMessagePart(), 'ticker')

        if (ticker) {
          client.updateConversationState({
            requestedTicker: ticker,
            confirmedTicker: null,
          })
        }
      },

      satisfied() {
        return Boolean(client.getConversationState().requestedTicker)
      },

      prompt() {
        client.addResponse('prompt_ticker')

        client.expect('request_price', ['decline', 'provide_ticker'])
        client.done()
      }
    })

    const confirmTicker = client.createStep({
      satisfied() {
        return Boolean(client.getConversationState().confirmedTicker)
      },

      prompt() {
        let baseClassification = client.getMessagePart().classification.base_type.value
        if (baseClassification === 'affirmative') {
          client.updateConversationState({
            confirmedTicker: client.getConversationState().requestedTicker,
          })
          return 'init.proceed'
        } else if (baseClassification === 'decline') {
          client.updateConversationState({
            requestedTicker: null, // Clear the requestedTicker so it's re-asked
            confirmedTicker: null,
          })

          client.addResponse('reprompt_ticker')
          client.done()
        }

        client.addResponse('confirm_ticker', {
          ticker: client.getConversationState().requestedTicker,
        })

        // If the next message is a 'decline', like 'don't know'
        // An 'affirmative', like 'yeah', or 'that's right'
        // or a ticker, the stream 'request_price' will be run
        client.expect('request_price', ['affirmative', 'decline', 'provide_ticker'])
        client.done()
      }
    })

    const providePrice = client.createStep({
      satisfied() {
        return false // This forces the step to be activated
      },

      prompt() {
        client.addResponse('provide_price', {
          ticker: client.getConversationState().requestedTicker,
          price: '$ 28.34',
        })
        client.done()
      }
    })

    client.runFlow({
      classifications: {
        'request_price': 'getPrice',
      },
      streams: {
        main: 'getPrice',
        getPrice: [collectTicker, confirmTicker, providePrice],
      }
    })

  const sayHello = client.createStep({
    satisfied() {
      return Boolean(client.getConversationState().helloSent)
    },

    prompt() {
      client.addResponse('welcome')
      client.addResponse('provide/documentation', {
        documentation_link: 'http://docs.init.ai',
      })
      client.addResponse('provide/instructions')

      client.updateConversationState({
        helloSent: true
      })

      client.done()
    }
  })
}
