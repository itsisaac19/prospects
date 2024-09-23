async function* streamAsyncIterable(stream) {
    const reader = stream.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) return
        yield value
      }
    } finally {
      reader.releaseLock()
    }
  }


const tst = async () => {
    const response = await fetch(`https://api.publicapis.org/entries`)
    let responseSize = 0
    for await (const chunk of streamAsyncIterable(response.body)) {
        responseSize += chunk.length
        console.log(responseSize)
    }
}
tst();