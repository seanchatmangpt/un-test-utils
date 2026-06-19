import { ASTAnalyzer } from './index.js'
import { Store, Writer, DataFactory } from 'n3'

const { namedNode, literal, quad } = DataFactory

const XSD = 'http://www.w3.org/2001/XMLSchema#'
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#'

/**
 * CLCoverageAnalyzer compatibility layer
 * Delegates to ASTAnalyzer and provides Turtle format export capabilities.
 */
export class CLCoverageAnalyzer {
  constructor(options = {}) {
    this.options = options
    this.astAnalyzer = new ASTAnalyzer(options)
  }

  async analyze(options = {}) {
    return await this.astAnalyzer.analyze(options)
  }

  async formatReport(report, options = {}) {
    const format = options.format || this.options.format || 'text'

    if (format.toLowerCase() === 'turtle') {
      const { baseUri = 'http://example.org/cli', cliName = 'cli' } = options
      const timestamp = report.metadata?.analyzedAt || new Date().toISOString()

      const store = new Store()
      const cliUri = `${baseUri}/${cliName}`

      store.addQuad(quad(
        namedNode(cliUri),
        namedNode(`${RDF}type`),
        namedNode('http://example.org/cli#Application')
      ))
      store.addQuad(quad(
        namedNode(cliUri),
        namedNode(`${RDFS}label`),
        literal(cliName)
      ))
      store.addQuad(quad(
        namedNode(cliUri),
        namedNode('http://example.org/cli#analyzedAt'),
        literal(timestamp, namedNode(`${XSD}dateTime`))
      ))

      const overall = report.coverage?.summary?.overall || { percentage: 0 }
      store.addQuad(quad(
        namedNode(cliUri),
        namedNode('http://example.org/coverage#overallCoverage'),
        literal(overall.percentage.toFixed(1), namedNode(`${XSD}decimal`))
      ))

      const writer = new Writer({ format: 'Turtle' })
      return new Promise((resolve, reject) => {
        writer.addQuads(store.getQuads(null, null, null, null))
        writer.end((error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        })
      })
    }

    return JSON.stringify(report, null, 2)
  }
}
