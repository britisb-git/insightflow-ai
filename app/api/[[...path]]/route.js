import { MongoClient } from 'mongodb'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'
import OpenAI from 'openai'

const client = new MongoClient(process.env.MONGO_URL)
let clientPromise

async function getDatabase() {
  if (!clientPromise) {
    clientPromise = client.connect()
  }
  await clientPromise
  return client.db(process.env.DB_NAME)
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.emergent.sh/v1'
})

// JWT Helper
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Auth Middleware
function getAuthUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  return decoded ? decoded.userId : null
}

// Routes Handler
export async function GET(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api', '')

  try {
    // Root API
    if (path === '/' || path === '') {
      return NextResponse.json({ 
        message: 'InsightFlow AI API',
        version: '1.0.0',
        status: 'running'
      })
    }

    // Get user datasets
    if (path === '/datasets') {
      const userId = getAuthUser(request)
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const db = await getDatabase()
      const datasets = await db.collection('datasets')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray()

      return NextResponse.json({ datasets })
    }

    // Get dataset by ID
    if (path.startsWith('/datasets/')) {
      const datasetId = path.split('/')[2]
      const userId = getAuthUser(request)
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const db = await getDatabase()
      const dataset = await db.collection('datasets').findOne({ 
        datasetId, 
        userId 
      })

      if (!dataset) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
      }

      return NextResponse.json({ dataset })
    }

    // Get chat history
    if (path.startsWith('/chat/')) {
      const datasetId = path.split('/')[2]
      const userId = getAuthUser(request)
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const db = await getDatabase()
      const messages = await db.collection('chat_messages')
        .find({ datasetId, userId })
        .sort({ timestamp: 1 })
        .toArray()

      return NextResponse.json({ messages })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api', '')

  try {
    // Signup
    if (path === '/auth/signup') {
      const body = await request.json()
      const { name, email, password } = body

      if (!name || !email || !password) {
        return NextResponse.json({ error: 'All fields required' }, { status: 400 })
      }

      const db = await getDatabase()
      
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const userId = uuidv4()

      await db.collection('users').insertOne({
        userId,
        name,
        email,
        password: hashedPassword,
        createdAt: new Date()
      })

      const token = generateToken(userId)

      return NextResponse.json({ 
        token, 
        user: { userId, name, email } 
      })
    }

    // Login
    if (path === '/auth/login') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json({ error: 'All fields required' }, { status: 400 })
      }

      const db = await getDatabase()
      const user = await db.collection('users').findOne({ email })

      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const token = generateToken(user.userId)

      return NextResponse.json({ 
        token, 
        user: { 
          userId: user.userId, 
          name: user.name, 
          email: user.email 
        } 
      })
    }

    // Upload and analyze dataset
    if (path === '/datasets/upload') {
      const userId = getAuthUser(request)
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const formData = await request.formData()
      const file = formData.get('file')
      
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: 'buffer' })

      // Parse all sheets
      const sheets = []
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)
        
        if (data.length > 0) {
          sheets.push({
            name: sheetName,
            rowCount: data.length,
            columns: Object.keys(data[0] || {}),
            preview: data.slice(0, 5),
            data: data
          })
        }
      }

      // Smart Data Analysis (with AI fallback)
      let analysis
      
      try {
        // Try AI analysis first
        const analysisPrompt = `Analyze this dataset structure and provide insights:

Dataset: ${file.name}
Sheets: ${sheets.map(s => `${s.name} (${s.rowCount} rows, columns: ${s.columns.join(', ')})`).join('; ')}

Sample data from first sheet:
${JSON.stringify(sheets[0]?.preview || [], null, 2)}

Provide:
1. Key dimensions (categorical fields)
2. Key measures (numeric fields)
3. Date/time fields
4. Possible relationships between sheets
5. Suggested KPIs
6. Business insights you can derive

Format as JSON with keys: dimensions, measures, dateFields, relationships, suggestedKPIs, insights`

        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert data analyst. Analyze dataset structures and provide actionable insights.' },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })

        analysis = JSON.parse(aiResponse.choices[0].message.content)
      } catch (error) {
        console.log('AI analysis not available, using smart fallback analysis')
        
        // Smart fallback: analyze data structure programmatically
        const firstSheet = sheets[0]
        const sampleRow = firstSheet?.data[0] || {}
        
        const dimensions = []
        const measures = []
        const dateFields = []
        
        firstSheet?.columns.forEach(col => {
          const sampleValue = sampleRow[col]
          const allValues = firstSheet.data.map(row => row[col]).filter(v => v != null)
          
          // Detect date fields
          if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) {
            dateFields.push(col)
          }
          // Detect numeric measures
          else if (typeof sampleValue === 'number' || col.toLowerCase().includes('amount') || 
                   col.toLowerCase().includes('price') || col.toLowerCase().includes('total') ||
                   col.toLowerCase().includes('count') || col.toLowerCase().includes('rate')) {
            measures.push(col)
          }
          // Everything else is a dimension
          else {
            dimensions.push(col)
          }
        })
        
        // Detect relationships between sheets
        const relationships = []
        if (sheets.length > 1) {
          const allColumns = sheets.flatMap(s => s.columns.map(c => ({ sheet: s.name, column: c })))
          const columnCounts = {}
          
          allColumns.forEach(({ sheet, column }) => {
            const key = column.toLowerCase()
            if (!columnCounts[key]) columnCounts[key] = []
            columnCounts[key].push(sheet)
          })
          
          Object.entries(columnCounts).forEach(([col, sheetList]) => {
            if (sheetList.length > 1) {
              relationships.push({
                column: col,
                sheets: sheetList,
                type: 'Possible join key'
              })
            }
          })
        }
        
        // Generate insights based on data
        const insights = []
        insights.push(`Analyzed ${firstSheet?.rowCount || 0} records across ${sheets.length} sheet(s)`)
        
        if (measures.length > 0) {
          insights.push(`Found ${measures.length} numeric measures for analysis: ${measures.slice(0, 3).join(', ')}`)
        }
        
        if (dimensions.length > 0) {
          insights.push(`Identified ${dimensions.length} categorical dimensions: ${dimensions.slice(0, 3).join(', ')}`)
        }
        
        if (dateFields.length > 0) {
          insights.push(`Time-based analysis available with ${dateFields.length} date field(s)`)
        }
        
        if (relationships.length > 0) {
          insights.push(`Detected ${relationships.length} potential relationship(s) between sheets`)
        }
        
        // Suggest KPIs
        const suggestedKPIs = ['Total Records', 'Data Completeness']
        if (measures.length > 0) {
          suggestedKPIs.push(`Total ${measures[0]}`, `Average ${measures[0]}`)
        }
        if (dimensions.length > 0) {
          suggestedKPIs.push(`Breakdown by ${dimensions[0]}`)
        }
        
        analysis = {
          dimensions: dimensions.slice(0, 10),
          measures: measures.slice(0, 10),
          dateFields,
          relationships,
          suggestedKPIs,
          insights
        }
      }

      const datasetId = uuidv4()
      const db = await getDatabase()

      await db.collection('datasets').insertOne({
        datasetId,
        userId,
        fileName: file.name,
        fileSize: file.size,
        sheets,
        analysis,
        createdAt: new Date()
      })

      return NextResponse.json({ 
        datasetId,
        fileName: file.name,
        sheets: sheets.map(s => ({ name: s.name, rowCount: s.rowCount, columns: s.columns })),
        analysis
      })
    }

    // Chat with AI about dataset
    if (path === '/chat') {
      const userId = getAuthUser(request)
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()
      const { datasetId, message } = body

      if (!datasetId || !message) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const db = await getDatabase()
      const dataset = await db.collection('datasets').findOne({ datasetId, userId })

      if (!dataset) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
      }

      // Get chat history
      const history = await db.collection('chat_messages')
        .find({ datasetId, userId })
        .sort({ timestamp: 1 })
        .limit(20)
        .toArray()

      // Build context
      const contextPrompt = `You are analyzing this dataset:
File: ${dataset.fileName}
Sheets: ${dataset.sheets.map(s => `${s.name} (${s.rowCount} rows)`).join(', ')}
Columns available: ${dataset.sheets.map(s => s.columns.join(', ')).join(' | ')}

Analysis: ${JSON.stringify(dataset.analysis, null, 2)}

Sample data:
${JSON.stringify(dataset.sheets[0]?.preview || [], null, 2)}

User question: ${message}

Provide a helpful response. If they ask for a chart, respond with JSON containing:
{
  "type": "response",
  "message": "your text response",
  "chart": {
    "type": "bar|line|pie|area",
    "title": "Chart title",
    "data": [...],
    "xAxis": "field name",
    "yAxis": "field name"
  }
}

For insights or summaries, provide detailed analysis.`

      const messages = [
        { role: 'system', content: 'You are an expert data analyst helping users understand their data through natural language.' },
        ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: contextPrompt }
      ]

      let aiMessage
      
      try {
        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.8
        })

        aiMessage = aiResponse.choices[0].message.content
      } catch (error) {
        console.log('AI chat not available, using smart fallback')
        
        // Smart fallback: generate response based on keywords and data
        const lowerMessage = message.toLowerCase()
        let fallbackResponse = ''
        
        if (lowerMessage.includes('trend') || lowerMessage.includes('over time')) {
          const dateField = dataset.analysis.dateFields[0] || 'date'
          const measure = dataset.analysis.measures[0] || 'value'
          fallbackResponse = `To analyze trends, I would look at ${measure} over time using ${dateField}. `
          fallbackResponse += `Your dataset contains ${dataset.sheets[0]?.rowCount} records. `
          fallbackResponse += `Key insights: ${dataset.analysis.insights.join('. ')}`
        }
        else if (lowerMessage.includes('top') || lowerMessage.includes('highest') || lowerMessage.includes('most')) {
          const dimension = dataset.analysis.dimensions[0] || 'category'
          const measure = dataset.analysis.measures[0] || 'value'
          fallbackResponse = `Based on your data, analyzing the top items by ${measure} grouped by ${dimension}. `
          fallbackResponse += `Your dataset has ${dataset.analysis.dimensions.length} dimensions to explore: ${dataset.analysis.dimensions.slice(0, 3).join(', ')}.`
        }
        else if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus')) {
          fallbackResponse = `To compare items in your dataset, I recommend using these dimensions: ${dataset.analysis.dimensions.slice(0, 3).join(', ')}. `
          fallbackResponse += `You can measure by: ${dataset.analysis.measures.slice(0, 3).join(', ')}.`
        }
        else if (lowerMessage.includes('dashboard') || lowerMessage.includes('overview') || lowerMessage.includes('summary')) {
          fallbackResponse = `Here's a summary of your ${dataset.fileName}:\\n\\n`
          fallbackResponse += `📊 Total Records: ${dataset.sheets[0]?.rowCount}\\n`
          fallbackResponse += `📈 Key Measures: ${dataset.analysis.measures.slice(0, 3).join(', ')}\\n`
          fallbackResponse += `🏷️ Dimensions: ${dataset.analysis.dimensions.slice(0, 3).join(', ')}\\n\\n`
          fallbackResponse += `Insights:\\n${dataset.analysis.insights.map(i => `• ${i}`).join('\\n')}`
        }
        else {
          fallbackResponse = `I analyzed your dataset "${dataset.fileName}". `
          fallbackResponse += `It contains ${dataset.sheets.length} sheet(s) with ${dataset.sheets[0]?.rowCount} total records. `
          fallbackResponse += `\\n\\nAvailable for analysis:\\n`
          fallbackResponse += `• Dimensions: ${dataset.analysis.dimensions.slice(0, 5).join(', ')}\\n`
          fallbackResponse += `• Measures: ${dataset.analysis.measures.slice(0, 5).join(', ')}\\n`
          fallbackResponse += `\\nYou can ask me to:\\n- Show trends over time\\n- Compare different categories\\n- Find top/bottom performers\\n- Generate a dashboard`
        }
        
        aiMessage = fallbackResponse
      }

      // Save messages
      const userMsgId = uuidv4()
      const aiMsgId = uuidv4()

      await db.collection('chat_messages').insertMany([
        {
          messageId: userMsgId,
          datasetId,
          userId,
          role: 'user',
          content: message,
          timestamp: new Date()
        },
        {
          messageId: aiMsgId,
          datasetId,
          userId,
          role: 'assistant',
          content: aiMessage,
          timestamp: new Date()
        }
      ])

      // Try to parse chart data
      let parsedResponse
      try {
        parsedResponse = JSON.parse(aiMessage)
      } catch {
        parsedResponse = { message: aiMessage, type: 'text' }
      }

      return NextResponse.json({ response: parsedResponse })
    }

    // Generate chart
    if (path === '/chart/generate') {
      const userId = getAuthUser(request)
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await request.json()
      const { datasetId, query } = body

      const db = await getDatabase()
      const dataset = await db.collection('datasets').findOne({ datasetId, userId })

      if (!dataset) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
      }

      // Generate chart based on query
      const chartPrompt = `Based on this data, create a chart specification for: "${query}"

Dataset structure:
${JSON.stringify(dataset.sheets.map(s => ({ name: s.name, columns: s.columns })), null, 2)}

Sample data:
${JSON.stringify(dataset.sheets[0]?.data.slice(0, 10) || [], null, 2)}

Return JSON with:
{
  "chartType": "bar|line|pie|area",
  "title": "Chart title",
  "xField": "column for x-axis",
  "yField": "column for y-axis",
  "aggregation": "sum|count|avg",
  "data": [processed data array with {name, value} format]
}

Process the actual data and return ready-to-use chart data.`

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a data visualization expert. Generate chart specifications from data.' },
          { role: 'user', content: chartPrompt }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      })

      const chartSpec = JSON.parse(aiResponse.choices[0].message.content)

      return NextResponse.json({ chart: chartSpec })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api', '')

  try {
    if (path.startsWith('/datasets/')) {
      const datasetId = path.split('/')[2]
      const userId = getAuthUser(request)
      
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const db = await getDatabase()
      const result = await db.collection('datasets').deleteOne({ datasetId, userId })

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
      }

      // Delete associated chat messages
      await db.collection('chat_messages').deleteMany({ datasetId })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
