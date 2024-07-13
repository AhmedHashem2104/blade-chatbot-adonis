import type { HttpContext } from '@adonisjs/core/http'
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { XataVectorSearch } from '@langchain/community/vectorstores/xata'
import { BaseClient } from '@xata.io/client'
import { Document } from '@langchain/core/documents'
import { VectorDBQAChain } from 'langchain/chains'

export default class ChatsController {
  async askQuestion({ response, request }: HttpContext) {
    const getXataClient = () => {
      if (!process.env.XATA_API_KEY) {
        throw new Error('XATA_API_KEY not set')
      }

      if (!process.env.XATA_DB_URL) {
        throw new Error('XATA_DB_URL not set')
      }
      const xata = new BaseClient({
        databaseURL: process.env.XATA_DB_URL,
        apiKey: process.env.XATA_API_KEY,
        branch: process.env.XATA_BRANCH || 'main',
      })
      return xata
    }
    // Open AI API Key is required to use OpenAIEmbeddings, some other embeddings may also be used
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    })
    const client = getXataClient()
    const table = 'vectors'
    const store = new XataVectorSearch(embeddings, { client, table })
    const model = new ChatGoogleGenerativeAI()
    const chain = VectorDBQAChain.fromLLM(model, store, {
      k: 1,
      returnSourceDocuments: true,
    })

    const res = await chain.invoke({ query: request.body().message })

    return response.json(res)
  }

  async store({ response, request }: HttpContext) {
    const getXataClient = () => {
      if (!process.env.XATA_API_KEY) {
        throw new Error('XATA_API_KEY not set')
      }

      if (!process.env.XATA_DB_URL) {
        throw new Error('XATA_DB_URL not set')
      }
      const xata = new BaseClient({
        databaseURL: process.env.XATA_DB_URL,
        apiKey: process.env.XATA_API_KEY,
        branch: process.env.XATA_BRANCH || 'main',
      })
      return xata
    }
    // Open AI API Key is required to use OpenAIEmbeddings, some other embeddings may also be used
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    })

    const client = getXataClient()
    const table = 'vectors'
    const store = new XataVectorSearch(embeddings, { client, table })
    // Add documents
    const docs = [
      new Document({
        pageContent: request.body().content,
        metadata: { author: 'Xata' },
      }),
    ]
    await store.addDocuments(docs)

    return response.json({
      message: `Docs added`,
    })
  }
}
