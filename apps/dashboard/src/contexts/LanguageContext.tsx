"use client";

import { createContext, useContext, useState } from "react";
import type {
  ContextProviderProps,
  Language,
  LanguageContextType,
  Translations,
} from "./interface";

export type { Language } from "./interface";

const t: Translations = {
  "nav.features": { pt: "Recursos", en: "Features", es: "Características" },
  "nav.benefits": { pt: "Benefícios", en: "Benefits", es: "Beneficios" },
  "nav.testimonials": {
    pt: "Depoimentos",
    en: "Testimonials",
    es: "Testimonios",
  },
  "nav.signin": { pt: "Entrar", en: "Sign In", es: "Iniciar Sesión" },
  "nav.getstarted": { pt: "Começar", en: "Get Started", es: "Empezar" },

  "hero.badge": {
    pt: "Criptografia bancária · Mais de 50.000 usuários",
    en: "Bank-grade encryption · 50,000+ users",
    es: "Cifrado bancario · Más de 50.000 usuarios",
  },
  "hero.title1": { pt: "Seu Dinheiro,", en: "Your Money,", es: "Tu Dinero," },
  "hero.title2": { pt: "Reimaginado", en: "Reimagined", es: "Reimaginado" },
  "hero.title3": {
    pt: "com Pura Elegância",
    en: "in Pure Elegance",
    es: "con Pura Elegancia",
  },
  "hero.subtitle": {
    pt: "Experimente a próxima geração de finanças pessoais. Acompanhe, gerencie e faça seu patrimônio crescer com uma plataforma bancária feita para a era moderna.",
    en: "Experience next-generation personal finance. Track, manage, and grow your wealth with a banking platform designed for the modern era.",
    es: "Experimente las finanzas personales de nueva generación. Rastree, administre y haga crecer su patrimonio con una plataforma bancaria diseñada para la era moderna.",
  },
  "hero.cta1": {
    pt: "Abra Sua Conta",
    en: "Open Your Account",
    es: "Abra Su Cuenta",
  },
  "hero.cta2": {
    pt: "Explorar Recursos",
    en: "Explore Features",
    es: "Explorar Características",
  },
  "hero.premium": {
    pt: "ByteBank Premium",
    en: "ByteBank Premium",
    es: "ByteBank Premium",
  },
  "hero.savings": {
    pt: "Meta de Economia",
    en: "Savings Goal",
    es: "Meta de Ahorro",
  },
  "hero.reached": {
    pt: "82% alcançado",
    en: "82% reached",
    es: "82% alcanzado",
  },
  "hero.month": {
    pt: "+12,4% este mês",
    en: "+12.4% this month",
    es: "+12,4% este mes",
  },

  "features.title1": { pt: "Feito para", en: "Built for", es: "Hecho para" },
  "features.title2": { pt: "Você", en: "You", es: "Ti" },
  "features.subtitle": {
    pt: "Cada recurso projetado para dar controle total sobre suas finanças.",
    en: "Every feature crafted to give you unparalleled control over your finances.",
    es: "Cada función diseñada para darte un control total sobre tus finanzas.",
  },
  "features.security.title": {
    pt: "Segurança Blindada",
    en: "Fortress-Grade Security",
    es: "Seguridad Blindada",
  },
  "features.security.desc": {
    pt: "Criptografia de 256 bits com autenticação biométrica e monitoramento de fraudes em tempo real.",
    en: "256-bit encryption with biometric authentication and real-time fraud monitoring.",
    es: "Cifrado de 256 bits con autenticación biométrica y monitoreo de fraudes en tiempo real.",
  },
  "features.insights.title": {
    pt: "Análise de Gastos",
    en: "Spending Insights",
    es: "Análisis de Gastos",
  },
  "features.insights.desc": {
    pt: "Análises com IA que categorizam e visualizam seus padrões de gastos instantaneamente.",
    en: "AI-powered analytics that categorize and visualize your spending patterns instantly.",
    es: "Análisis con IA que categorizan y visualizan tus patrones de gasto instantáneamente.",
  },
  "features.cards.title": {
    pt: "Cartões Premium",
    en: "Premium Cards",
    es: "Tarjetas Premium",
  },
  "features.cards.desc": {
    pt: "Cartões virtuais e físicos sem taxas internacionais e com cashback.",
    en: "Virtual and physical cards with no foreign transaction fees and cashback rewards.",
    es: "Tarjetas virtuales y físicas sin comisiones internacionales y con cashback.",
  },
  "features.transfers.title": {
    pt: "Transferências Instantâneas",
    en: "Instant Transfers",
    es: "Transferencias Instantáneas",
  },
  "features.transfers.desc": {
    pt: "Envie e receba dinheiro globalmente com zero taxas e liquidação em tempo real.",
    en: "Send and receive money globally with zero fees and real-time settlement.",
    es: "Envía y recibe dinero globalmente con cero comisiones y liquidación en tiempo real.",
  },
  "features.privacy.title": {
    pt: "Privacidade em Primeiro Lugar",
    en: "Privacy First",
    es: "Privacidad Primero",
  },
  "features.privacy.desc": {
    pt: "Seus dados são seus. Sem venda, sem compartilhamento — privacidade financeira total.",
    en: "Your data stays yours. No selling, no sharing—complete financial privacy.",
    es: "Tus datos son tuyos. Sin vender, sin compartir — privacidad financiera total.",
  },
  "features.mobile.title": {
    pt: "Nativo Mobile",
    en: "Mobile Native",
    es: "Nativo Móvil",
  },
  "features.mobile.desc": {
    pt: "Experiência bancária completa otimizada para todos os dispositivos, onde você estiver.",
    en: "Full banking experience optimized for every device, anywhere you go.",
    es: "Experiencia bancaria completa optimizada para todos los dispositivos, donde vayas.",
  },

  "benefits.title1": {
    pt: "Por que Escolher o",
    en: "Why Choose",
    es: "Por qué Elegir",
  },
  "benefits.subtitle": {
    pt: "Uma experiência bancária que coloca seu bem-estar financeiro em primeiro lugar.",
    en: "A banking experience that puts your financial well-being first.",
    es: "Una experiencia bancaria que pone tu bienestar financiero en primer lugar.",
  },
  "benefits.fees.title": {
    pt: "Zero Taxas Ocultas",
    en: "Zero Hidden Fees",
    es: "Cero Tarifas Ocultas",
  },
  "benefits.fees.desc": {
    pt: "Preços transparentes sem taxas de manutenção, sem saldo mínimo e sem surpresas.",
    en: "Transparent pricing with no maintenance fees, no minimum balance, and no surprises.",
    es: "Precios transparentes sin tarifas de mantenimiento, sin saldo mínimo y sin sorpresas.",
  },
  "benefits.invest.title": {
    pt: "Investimentos Inteligentes",
    en: "Smart Investments",
    es: "Inversiones Inteligentes",
  },
  "benefits.invest.desc": {
    pt: "Micro-investimentos automatizados e acompanhamento de portfólio para crescer seu patrimônio sem esforço.",
    en: "Automated micro-investments and portfolio tracking to grow your wealth effortlessly.",
    es: "Micro-inversiones automatizadas y seguimiento de cartera para hacer crecer tu patrimonio sin esfuerzo.",
  },
  "benefits.savings.title": {
    pt: "Poupança Inteligente",
    en: "Intelligent Savings",
    es: "Ahorro Inteligente",
  },
  "benefits.savings.desc": {
    pt: "Arredondamento de poupança, transferências programadas e contas baseadas em metas que trabalham para você.",
    en: "Round-up savings, scheduled transfers, and goal-based accounts that work for you.",
    es: "Ahorro por redondeo, transferencias programadas y cuentas basadas en metas que trabajan para ti.",
  },

  "testimonials.title1": {
    pt: "Confiado por",
    en: "Trusted by",
    es: "Con la Confianza de",
  },
  "testimonials.title2": { pt: "Milhares", en: "Thousands", es: "Miles" },
  "testimonials.subtitle": {
    pt: "Junte-se a uma comunidade de pessoas exigentes que buscam excelência.",
    en: "Join a community of discerning individuals who demand excellence.",
    es: "Únase a una comunidad de personas exigentes que buscan la excelencia.",
  },
  "testimonials.1.text": {
    pt: "O ByteBank transformou como gerencio minhas finanças empresariais. Os insights são inestimáveis.",
    en: "ByteBank transformed how I manage my business finances. The insights are invaluable.",
    es: "ByteBank transformó cómo gestiono mis finanzas empresariales. Los insights son invaluables.",
  },
  "testimonials.1.name": {
    pt: "Sofia Laurent",
    en: "Sophia Laurent",
    es: "Sofía Laurent",
  },
  "testimonials.1.role": {
    pt: "Empreendedora",
    en: "Entrepreneur",
    es: "Emprendedora",
  },
  "testimonials.2.text": {
    pt: "A experiência bancária mais limpa e intuitiva que já usei. A segurança é excepcional.",
    en: "The cleanest, most intuitive banking experience I've ever used. Security is outstanding.",
    es: "La experiencia bancaria más limpia e intuitiva que he usado. La seguridad es excepcional.",
  },
  "testimonials.2.name": {
    pt: "Marcus Chen",
    en: "Marcus Chen",
    es: "Marcus Chen",
  },
  "testimonials.2.role": {
    pt: "Analista de Investimentos",
    en: "Investment Analyst",
    es: "Analista de Inversiones",
  },
  "testimonials.3.text": {
    pt: "Finalmente, um banco que combina com a estética que exijo. Bonito e funcional.",
    en: "Finally, a bank that matches the aesthetic I demand. Beautiful and functional.",
    es: "Por fin, un banco que combina con la estética que exijo. Bonito y funcional.",
  },
  "testimonials.3.name": {
    pt: "Isabella Rossi",
    en: "Isabella Rossi",
    es: "Isabella Rossi",
  },
  "testimonials.3.role": { pt: "Designer", en: "Designer", es: "Diseñadora" },

  "cta.title": {
    pt: "Pronto para Elevar suas Finanças?",
    en: "Ready to Elevate Your Finances?",
    es: "¿Listo para Elevar tus Finanzas?",
  },
  "cta.subtitle": {
    pt: "Junte-se ao ByteBank hoje e experimente um banco tão ambicioso quanto você.",
    en: "Join ByteBank today and experience banking that's as ambitious as you are.",
    es: "Únase a ByteBank hoy y experimente un banco tan ambicioso como usted.",
  },
  "cta.button": { pt: "Começar Agora", en: "Start Now", es: "Empezar Ahora" },

  "footer.rights": {
    pt: "© 2026 ByteBank. Todos os direitos reservados.",
    en: "© 2026 ByteBank. All rights reserved.",
    es: "© 2026 ByteBank. Todos los derechos reservados.",
  },
  "footer.trust": { pt: "Confiança", en: "Trust", es: "Confianza" },

  "login.title": {
    pt: "Bem-vindo de volta",
    en: "Welcome back",
    es: "Bienvenido de vuelta",
  },
  "login.subtitle": {
    pt: "Entre na sua conta ByteBank",
    en: "Sign in to your ByteBank account",
    es: "Inicie sesión en su cuenta ByteBank",
  },
  "login.email": { pt: "E-mail", en: "Email", es: "Correo electrónico" },
  "login.password": { pt: "Senha", en: "Password", es: "Contraseña" },
  "login.button": { pt: "Entrar", en: "Sign In", es: "Iniciar Sesión" },
  "login.demo": {
    pt: "Credenciais de demonstração: email@teste.com / 123",
    en: "Demo credentials: email@teste.com / 123",
    es: "Credenciales de demostración: email@teste.com / 123",
  },
  "login.back": {
    pt: "← Voltar ao início",
    en: "← Back to home",
    es: "← Volver al inicio",
  },
  "login.error": {
    pt: "E-mail ou senha inválidos",
    en: "Invalid email or password",
    es: "Correo o contraseña inválidos",
  },

  "dash.brand": { pt: "ByteBank", en: "ByteBank", es: "ByteBank" },
  "dash.hello": { pt: "Olá, Fulano", en: "Hello, Fulano", es: "Hola, Fulano" },
  "dash.hideValues": {
    pt: "Ocultar valores",
    en: "Hide amounts",
    es: "Ocultar valores",
  },
  "dash.valueHidden": {
    pt: "Valor oculto",
    en: "Amount hidden",
    es: "Valor oculto",
  },
  "dash.offline": {
    pt: "Você está offline. Os dados exibidos podem estar desatualizados até a conexão voltar.",
    en: "You are offline. The data shown may be outdated until the connection is back.",
    es: "Estás sin conexión. Los datos mostrados pueden estar desactualizados hasta que vuelva la conexión.",
  },
  "dash.overview": { pt: "Painel", en: "Dashboard", es: "Panel" },
  "dash.overview.subtitle": {
    pt: "Bem-vindo de volta. Aqui está sua visão financeira.",
    en: "Welcome back. Here's your financial overview.",
    es: "Bienvenido de vuelta. Aquí está tu visión financiera.",
  },
  "dash.balance": { pt: "Saldo Total", en: "Total Balance", es: "Saldo Total" },
  "dash.income": {
    pt: "Total de Entradas",
    en: "Total Income",
    es: "Total de Ingresos",
  },
  "dash.expenses": {
    pt: "Total de Saídas",
    en: "Total Expenses",
    es: "Total de Gastos",
  },
  "dash.savings": {
    pt: "Economia Líquida",
    en: "Net Savings",
    es: "Ahorro Neto",
  },
  "dash.chart": {
    pt: "Entradas vs Saídas",
    en: "Income vs Expenses",
    es: "Ingresos vs Gastos",
  },
  "dash.recent": {
    pt: "Últimas Movimentações",
    en: "Recent Transactions",
    es: "Últimas Transacciones",
  },

  "sidebar.overview": {
    pt: "Visão Geral",
    en: "Overview",
    es: "Visión General",
  },
  "sidebar.statement": { pt: "Extrato", en: "Statement", es: "Extracto" },
  "sidebar.income": { pt: "Entrada", en: "Income", es: "Ingresos" },
  "sidebar.expenses": { pt: "Saída", en: "Expenses", es: "Gastos" },
  "sidebar.profile": { pt: "Perfil", en: "Profile", es: "Perfil" },
  "sidebar.logout": { pt: "Sair", en: "Logout", es: "Cerrar Sesión" },

  "statement.title": { pt: "Extrato", en: "Statement", es: "Extracto" },
  "statement.subtitle": {
    pt: "Histórico completo de transações da sua conta.",
    en: "Complete transaction history for your account.",
    es: "Historial completo de transacciones de su cuenta.",
  },

  "income.title": { pt: "Entrada", en: "Income", es: "Ingresos" },
  "income.subtitle": {
    pt: "Todos os recursos recebidos e fontes de receita.",
    en: "All incoming funds and revenue streams.",
    es: "Todos los fondos recibidos y fuentes de ingresos.",
  },
  "income.total": {
    pt: "Total de Entradas",
    en: "Total Income",
    es: "Total de Ingresos",
  },
  "income.trend": {
    pt: "Tendência de Entradas",
    en: "Income Trend",
    es: "Tendencia de Ingresos",
  },
  "income.transactions": {
    pt: "Transações de Entrada",
    en: "Income Transactions",
    es: "Transacciones de Ingreso",
  },

  "expenses.title": { pt: "Saída", en: "Expenses", es: "Gastos" },
  "expenses.subtitle": {
    pt: "Acompanhe para onde seu dinheiro vai.",
    en: "Track where your money goes.",
    es: "Rastree a dónde va su dinero.",
  },
  "expenses.total": {
    pt: "Total de Saídas",
    en: "Total Expenses",
    es: "Total de Gastos",
  },
  "expenses.trend": {
    pt: "Tendência de Saídas",
    en: "Expense Trend",
    es: "Tendencia de Gastos",
  },
  "expenses.transactions": {
    pt: "Transações de Saída",
    en: "Expense Transactions",
    es: "Transacciones de Gasto",
  },

  "profile.title": { pt: "Perfil", en: "Profile", es: "Perfil" },
  "profile.subtitle": {
    pt: "Gerencie suas informações pessoais.",
    en: "Manage your personal information.",
    es: "Gestione su información personal.",
  },
  "profile.name": { pt: "Nome", en: "Name", es: "Nombre" },
  "profile.email": { pt: "E-mail", en: "Email", es: "Correo electrónico" },
  "profile.plan": { pt: "Plano", en: "Plan", es: "Plan" },
  "profile.since": {
    pt: "Membro desde",
    en: "Member since",
    es: "Miembro desde",
  },
  "profile.theme": { pt: "Tema", en: "Theme", es: "Tema" },
  "profile.dark": { pt: "Escuro", en: "Dark", es: "Oscuro" },
  "profile.light": { pt: "Claro", en: "Light", es: "Claro" },
  "profile.language": { pt: "Idioma", en: "Language", es: "Idioma" },

  "table.transaction": {
    pt: "Transação",
    en: "Transaction",
    es: "Transacción",
  },
  "table.category": { pt: "Categoria", en: "Category", es: "Categoría" },
  "table.date": { pt: "Data", en: "Date", es: "Fecha" },
  "table.status": { pt: "Status", en: "Status", es: "Estado" },
  "table.amount": { pt: "Valor", en: "Amount", es: "Monto" },
  "table.completed": { pt: "Concluído", en: "Completed", es: "Completado" },
  "table.pending": { pt: "Pendente", en: "Pending", es: "Pendiente" },
  "table.failed": { pt: "Falhou", en: "Failed", es: "Fallido" },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "pt",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: ContextProviderProps) {
  const [lang, setLang] = useState<Language>("pt");
  const translate = (key: string) => t[key]?.[lang] ?? key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
