/**
 * Export Service for CSV, PDF, and XML formats
 * Supports DPH přiznání, kontrolní hlášení, and accounting exports
 */

import { prisma } from '@/lib/db/prisma'

interface UserData {
  firstName: string
  lastName: string
  dic: string
  ico: string
  email: string
  address: string
  city: string
  zipCode: string
  whatsappPhone: string
}

interface DPHData {
  mesic: string           // "10" 
  rok: string             // "2024"
  pln23: number          // Plnění 21% základní sazba
  pln5: number           // Plnění 12% snížená sazba
  odp_tuz23: number      // Odpočet tuzemská 21%
  odp_tuz5: number       // Odpočet tuzemská 12%
  dan_zocelk: number     // Daň k doplatku celkem
}

interface KHData {
  mesic: string
  rok: string
  prijate_faktury: Array<{
    dic_dod: string        // DIČ dodavatele
    c_evid_dd: string      // Číslo evidenční dokladu
    dppd: string           // Datum plnění (DD.MM.YYYY)
    zakl_dane1: number     // Základ daně 21%
    dan1: number           // Daň 21%
    zakl_dane2: number     // Základ daně 12%
    dan2: number           // Daň 12%
    zakl_dane3: number     // Základ daně 0%
    dan3: number           // Daň 0%
  }>
}

export class ExportService {
  
  /**
   * Generate DPH přiznání XML
   */
  static async generateDPHPriznaniXML(userId: string, month: number, year: number): Promise<string> {
    const user = await this.getUserData(userId)
    const dphData = await this.getDPHData(userId, month, year)
    
    const currentDate = new Date().toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
    
    return `<Pisemnost nazevSW="uctobot.cz" verzeSW="${Date.now()}">
<DPHDP3>
<VetaD c_okec="900200" d_poddp="${currentDate}" dapdph_forma="B" dokument="DP3" k_uladis="DPH" mesic="${month.toString().padStart(2, '0')}" rok="${year}" typ_platce="P"/>
<VetaP c_ufo="463" c_pracufo="3207" typ_ds="F" c_telef="${user.whatsappPhone?.replace('+420', '') || ''}" dic="${user.dic}" email="${user.email || ''}" jmeno="${user.firstName}" prijmeni="${user.lastName}" c_pop="${this.extractStreetNumber(user.address)}" naz_obce="${user.city}" psc="${user.zipCode?.replace(' ', '') || ''}" stat="Česká republika" sest_jmeno="${user.firstName}" sest_prijmeni="${user.lastName}" sest_telef="${user.whatsappPhone?.replace('+420', '') || ''}"/>
<Veta4 pln23="${Math.round(dphData.pln23 * 100)}" odp_tuz23_nar="${Math.round(dphData.odp_tuz23 * 100)}" odp_sum_nar="${Math.round((dphData.odp_tuz23 + dphData.odp_tuz5) * 100)}"/>
<Veta6 odp_zocelk="${Math.round(dphData.dan_zocelk * 100)}" dano_no="${Math.round(dphData.dan_zocelk * 100)}"/>
</DPHDP3>
</Pisemnost>`
  }
  
  /**
   * Generate Kontrolní hlášení XML
   */
  static async generateKontrolniHlaseniXML(userId: string, month: number, year: number): Promise<string> {
    const user = await this.getUserData(userId)
    const khData = await this.getKHData(userId, month, year)
    
    const currentDate = new Date().toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    
    const streetNumber = this.extractStreetNumber(user.address)
    const street = this.extractStreetName(user.address)
    
    let xml = `<Pisemnost nazevSW="uctobot.cz" verzeSW="${Date.now()}">
<DPHKH1>
<VetaD d_poddp="${currentDate}" dokument="KH1" khdph_forma="B" k_uladis="DPH" mesic="${month.toString().padStart(2, '0')}" rok="${year}"/>
<VetaP c_pop="${streetNumber}" c_pracufo="3207" c_telef="${user.whatsappPhone?.replace('+420', '') || ''}" c_ufo="463" zkrobchjm="${user.firstName} ${user.lastName}" dic="${user.dic}" email="${user.email || ''}" id_dats="" jmeno="${user.firstName}" naz_obce="${user.city}" prijmeni="${user.lastName}" psc="${user.zipCode?.replace(' ', '') || ''}" sest_jmeno="${user.firstName}" sest_prijmeni="${user.lastName}" sest_telef="${user.whatsappPhone?.replace('+420', '') || ''}" stat="Česká republika" typ_ds="F" ulice="${streetNumber}"/>
<VetaA5 dan1="0" dan2="0" dan3="0" zakl_dane1="0" zakl_dane2="0" zakl_dane3="0"/>`

    // Přidání přijatých faktur
    khData.prijate_faktury.forEach(faktura => {
      xml += `
<VetaB2 c_evid_dd="${faktura.c_evid_dd}" dan1="${Math.round(faktura.dan1 * 100)}" dan2="${Math.round(faktura.dan2 * 100)}" dan3="${Math.round(faktura.dan3 * 100)}" dic_dod="${faktura.dic_dod}" dppd="${faktura.dppd}" pomer="N" zakl_dane1="${Math.round(faktura.zakl_dane1 * 100)}" zakl_dane2="${Math.round(faktura.zakl_dane2 * 100)}" zakl_dane3="${Math.round(faktura.zakl_dane3 * 100)}" zdph_44="N"/>`
    })

    xml += `
<VetaB3 dan1="0" dan2="0" dan3="0" zakl_dane1="0" zakl_dane2="0" zakl_dane3="0"/>
<VetaC celk_zd_a2="0" obrat23="0" obrat5="0" pln23="${Math.round(khData.pln23 * 100)}" pln5="${Math.round(khData.pln5 * 100)}" pln_rez_pren="0" rez_pren23="0" rez_pren5="0"/>
</DPHKH1>
</Pisemnost>`

    return xml
  }
  
  /**
   * Generate monthly CSV export
   */
  static async generateMonthlyCSV(userId: string, month: number, year: number): Promise<string> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59)
        }
      },
      orderBy: { transactionDate: 'asc' }
    })
    
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        expenseDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59)
        }
      },
      include: {
        category: true
      },
      orderBy: { expenseDate: 'asc' }
    })
    
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59)
        }
      },
      orderBy: { issueDate: 'asc' }
    })
    
    let csv = 'Datum;Typ;Popis;Částka;Kategorie;DIČ;Variabilní symbol;Poznámka\n'
    
    // Přidání transakcí
    transactions.forEach(tx => {
      const date = new Date(tx.transactionDate).toLocaleDateString('cs-CZ')
      const type = tx.type === 'INCOME' ? 'Příjem' : 'Výdaj'
      const amount = Number(tx.amount).toLocaleString('cs-CZ')
      csv += `${date};${type};${this.escapeCsv(tx.description || '')};${amount};${this.escapeCsv(tx.category || '')};${this.escapeCsv(tx.notes || '')};;;\n`
    })
    
    // Přidání výdajů
    expenses.forEach(expense => {
      const date = new Date(expense.expenseDate).toLocaleDateString('cs-CZ')
      const amount = Number(expense.amount).toLocaleString('cs-CZ')
      const category = expense.category?.name || 'Nezařazeno'
      csv += `${date};Výdaj;${this.escapeCsv(expense.description)};${amount};${this.escapeCsv(category)};${this.escapeCsv(expense.supplierDic || '')};${this.escapeCsv(expense.variableSymbol || '')};${this.escapeCsv(expense.notes || '')}\n`
    })
    
    // Přidání faktur
    invoices.forEach(invoice => {
      const date = new Date(invoice.issueDate).toLocaleDateString('cs-CZ')
      const amount = Number(invoice.amount).toLocaleString('cs-CZ')
      csv += `${date};Faktura;${this.escapeCsv(invoice.description || '')};${amount};Faktura;${this.escapeCsv(invoice.customerDic || '')};${this.escapeCsv(invoice.variableSymbol || '')};Č. ${invoice.invoiceNumber}\n`
    })
    
    return csv
  }
  
  /**
   * Generate quarterly export
   */
  static async generateQuarterlyExport(userId: string, quarter: number, year: number, format: 'csv' | 'xml'): Promise<string> {
    const startMonth = (quarter - 1) * 3 + 1
    const endMonth = quarter * 3
    
    if (format === 'csv') {
      let quarterlyCSV = ''
      
      for (let month = startMonth; month <= endMonth; month++) {
        const monthlyCSV = await this.generateMonthlyCSV(userId, month, year)
        if (month === startMonth) {
          quarterlyCSV += monthlyCSV // Include header for first month
        } else {
          quarterlyCSV += monthlyCSV.split('\n').slice(1).join('\n') // Skip header for other months
        }
      }
      
      return quarterlyCSV
    } else {
      // XML pro celé čtvrtletí - součet všech měsíců
      let quarterlyXML = `<CtvrtletniBilance rok="${year}" ctvrtleti="${quarter}">\n`
      
      for (let month = startMonth; month <= endMonth; month++) {
        const monthlyData = await this.getDPHData(userId, month, year)
        quarterlyXML += `  <Mesic cislo="${month}" pln23="${monthlyData.pln23}" odp_tuz23="${monthlyData.odp_tuz23}" dan_zocelk="${monthlyData.dan_zocelk}"/>\n`
      }
      
      quarterlyXML += `</CtvrtletniBilance>`
      return quarterlyXML
    }
  }
  
  /**
   * Get user data for exports
   */
  private static async getUserData(userId: string): Promise<UserData> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    return {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      dic: user.dic || '',
      ico: user.ico || '',
      email: user.email || '',
      address: user.address || user.companyAddress || '',
      city: user.city || '',
      zipCode: user.zipCode || '',
      whatsappPhone: user.whatsappPhone || ''
    }
  }
  
  /**
   * Calculate DPH data for given month
   */
  private static async getDPHData(userId: string, month: number, year: number): Promise<DPHData> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    // Příjmy (plnění)
    const income = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME',
        transactionDate: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
    
    const invoices = await prisma.invoice.aggregate({
      where: {
        userId,
        issueDate: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
    
    // Výdaje s DPH (odpočty)
    const expensesWithVAT = await prisma.expense.aggregate({
      where: {
        userId,
        expenseDate: { gte: startDate, lte: endDate },
        supplierDic: { not: null } // Pouze fakturace s DIČ
      },
      _sum: { amount: true }
    })
    
    const totalIncome = Number(income._sum.amount || 0) + Number(invoices._sum.amount || 0)
    const totalExpensesWithVAT = Number(expensesWithVAT._sum.amount || 0)
    
    // Výpočty DPH (21% sazba)
    const pln23 = totalIncome / 1.21 // Základ daně
    const odp_tuz23 = totalExpensesWithVAT / 1.21 // Základ odpočtu
    const dan_zocelk = (pln23 * 0.21) - (odp_tuz23 * 0.21) // Daň k doplatku
    
    return {
      mesic: month.toString().padStart(2, '0'),
      rok: year.toString(),
      pln23: Math.max(0, pln23),
      pln5: 0, // 12% sazba - TODO pokud bude potřeba
      odp_tuz23: Math.max(0, odp_tuz23),
      odp_tuz5: 0,
      dan_zocelk: Math.max(0, dan_zocelk)
    }
  }
  
  /**
   * Get kontrolní hlášení data
   */
  private static async getKHData(userId: string, month: number, year: number): Promise<KHData> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    
    // Přijaté faktury s DIČ
    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        expenseDate: { gte: startDate, lte: endDate },
        supplierDic: { not: null }
      }
    })
    
    const prijate_faktury = expenses.map(expense => ({
      dic_dod: expense.supplierDic || '',
      c_evid_dd: expense.expenseNumber || expense.id.substring(0, 16),
      dppd: new Date(expense.expenseDate).toLocaleDateString('cs-CZ'),
      zakl_dane1: Number(expense.amount) / 1.21, // 21% základ
      dan1: Number(expense.amount) - (Number(expense.amount) / 1.21), // 21% daň
      zakl_dane2: 0, // 12% sazba
      dan2: 0,
      zakl_dane3: 0, // 0% sazba  
      dan3: 0
    }))
    
    const dphData = await this.getDPHData(userId, month, year)
    
    return {
      mesic: month.toString().padStart(2, '0'),
      rok: year.toString(),
      prijate_faktury,
      pln23: dphData.pln23,
      pln5: dphData.pln5
    }
  }
  
  /**
   * Helper methods
   */
  private static extractStreetNumber(address: string): string {
    const match = address?.match(/(\d+)/)
    return match ? match[1] : ''
  }
  
  private static extractStreetName(address: string): string {
    return address?.replace(/\s*\d+.*$/, '') || ''
  }
  
  private static escapeCsv(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
  
  /**
   * Save export to database for tracking
   */
  static async saveExport(
    userId: string, 
    type: string, 
    period: string, 
    format: string, 
    content: string
  ): Promise<string> {
    const fileName = `${period}_${type}.${format}`
    
    // In production, save to cloud storage (AWS S3, etc.)
    // For now, just return a mock URL
    const downloadUrl = `https://uctobot.cz/exports/${fileName}`
    
    // Could save metadata to database here
    console.log(`📄 Export created: ${fileName} (${content.length} bytes)`)
    
    return downloadUrl
  }
}

export default ExportService