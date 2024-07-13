import type { HttpContext } from '@adonisjs/core/http'
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { XataVectorSearch } from '@langchain/community/vectorstores/xata'
import { BaseClient } from '@xata.io/client'
import { Document } from '@langchain/core/documents'
import { VectorDBQAChain } from 'langchain/chains'
import { Client, ClientOptions } from '@elastic/elasticsearch'
import {
  ElasticClientArgs,
  ElasticVectorSearch,
} from '@langchain/community/vectorstores/elasticsearch'

export default class ChatsController {
  async askQuestion({ response, request }: HttpContext) {
    const config: ClientOptions = {
      node:
        process.env.ELASTIC_URL ??
        'https://5058f5a8be3c447a97d9c0c4cf29c6a2.us-central1.gcp.cloud.es.io:443',
    }
    config.auth = {
      apiKey: {
        id: 'dK3vrJABNZ70BLrsmPUI',
        api_key: 'ZgJt9TjJSn-NmVo7JaJZAw',
      },
    }
    const clientArgs: ElasticClientArgs = {
      client: new Client(config),
      indexName: process.env.ELASTIC_INDEX ?? 'test_vectorstore02',
    }
    // const getXataClient = () => {
    //   if (!process.env.XATA_API_KEY) {
    //     throw new Error('XATA_API_KEY not set')
    //   }

    //   if (!process.env.XATA_DB_URL) {
    //     throw new Error('XATA_DB_URL not set')
    //   }
    //   const xata = new BaseClient({
    //     databaseURL: process.env.XATA_DB_URL,
    //     apiKey: process.env.XATA_API_KEY,
    //     branch: process.env.XATA_BRANCH || 'main',
    //   })
    //   return xata
    // }
    // Open AI API Key is required to use OpenAIEmbeddings, some other embeddings may also be used
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    })
    // const client = getXataClient()
    // const table = 'vectors'
    const store = new ElasticVectorSearch(embeddings, clientArgs)
    const model = new ChatGoogleGenerativeAI()
    const chain = VectorDBQAChain.fromLLM(model, store, {
      k: 1,
      returnSourceDocuments: true,
    })

    const res = await chain.invoke({ query: request.body().message })

    return response.json(res)
  }

  async store({ response, request }: HttpContext) {
    const config: ClientOptions = {
      node:
        process.env.ELASTIC_URL ??
        'https://5058f5a8be3c447a97d9c0c4cf29c6a2.us-central1.gcp.cloud.es.io:443',
    }
    config.auth = {
      apiKey: {
        id: 'dK3vrJABNZ70BLrsmPUI',
        api_key: 'ZgJt9TjJSn-NmVo7JaJZAw',
      },
    }
    const clientArgs: ElasticClientArgs = {
      client: new Client(config),
      indexName: process.env.ELASTIC_INDEX ?? 'test_vectorstore02',
    }
    // const getXataClient = () => {
    //   if (!process.env.XATA_API_KEY) {
    //     throw new Error('XATA_API_KEY not set')
    //   }

    //   if (!process.env.XATA_DB_URL) {
    //     throw new Error('XATA_DB_URL not set')
    //   }
    //   const xata = new BaseClient({
    //     databaseURL: process.env.XATA_DB_URL,
    //     apiKey: process.env.XATA_API_KEY,
    //     branch: process.env.XATA_BRANCH || 'main',
    //   })
    //   return xata
    // }
    // Open AI API Key is required to use OpenAIEmbeddings, some other embeddings may also be used
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    })

    // const client = getXataClient()
    // const table = 'vectors'
    const store = new ElasticVectorSearch(embeddings, clientArgs)
    // Add documents
    const docs = [
      new Document({
        pageContent: request.body().content,
        metadata: { foo: 'Xata' },
      }),
    ]
    await store.addDocuments(docs)

    return response.json({
      message: `Docs added`,
    })
  }
}
