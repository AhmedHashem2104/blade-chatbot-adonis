import type { HttpContext } from '@adonisjs/core/http'
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Document } from '@langchain/core/documents'
import { VectorDBQAChain } from 'langchain/chains'
import { Client, ClientOptions } from '@elastic/elasticsearch'
import {
  ElasticClientArgs,
  ElasticVectorSearch,
} from '@langchain/community/vectorstores/elasticsearch'
import app from '@adonisjs/core/services/app'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'

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
    const { content, type, fileType } = request.all()

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

    // Open AI API Key is required to use OpenAIEmbeddings, some other embeddings may also be used
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    })

    // const client = getXataClient()
    // const table = 'vectors'
    const store = new ElasticVectorSearch(embeddings, clientArgs)
    // Add documents
    let docs: any[] = []
    if (type === 'text')
      docs = [
        new Document({
          pageContent: content,
          metadata: { foo: 'Xata' },
        }),
      ]
    else {
      const file = request.file('file', {
        size: '1mb', // Set the size limit for the file
      })
      console.log(file, fileType)

      if (!file) {
        return response.badRequest('No file uploaded')
      }

      if (!file.isValid) {
        return response.badRequest(file.errors)
      }

      // Generate a unique name for the file
      const fileName = `${new Date().getTime()}.${file.extname}`
      // Move the file to the uploads directory
      await file.move(app.tmpPath('uploads'), {
        name: fileName,
        overwrite: true,
      })

      let loader: any

      if (fileType === 'application/pdf') {
        loader = new PDFLoader(app.tmpPath('uploads', fileName))
      } else if (fileType === 'text/plain') {
        loader = new TextLoader(app.tmpPath('uploads', fileName))
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        console.log(`ahmed`)
        loader = new DocxLoader(app.tmpPath('uploads', fileName))
        console.log(loader)
      }

      docs = await loader.load()
    }
    await store.addDocuments(docs)

    return response.json({
      message: `Docs added`,
    })
  }
}
