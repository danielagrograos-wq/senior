# 💰 SeniorCare+ | Análise Financeira Detalhada

---

## 1. MODELO DE RECEITA

### 1.1 Receita Principal: Taxa de Serviço (15%)

| Tipo de Serviço | Duração | Preço Médio | Taxa SeniorCare+ |
|-----------------|---------|-------------|------------------|
| Acompanhamento | 4 horas | R$ 140 | R$ 21 |
| Diária | 8 horas | R$ 280 | R$ 42 |
| Pernoite | 12 horas | R$ 380 | R$ 57 |
| 24 horas | 24 horas | R$ 550 | R$ 82,50 |
| Mensal | 30 dias | R$ 4.500 | R$ 675 |

### 1.2 Receitas Secundárias

| Produto | Preço | Margem |
|---------|-------|--------|
| Assinatura Cuidador Premium | R$ 49/mês | 100% |
| Verificação Expressa (24h) | R$ 99 | 60% |
| Curso Certificação | R$ 199 | 80% |
| Destaque no Ranking | R$ 29/mês | 100% |

---

## 2. ESTRUTURA DE CUSTOS

### 2.1 Custos Fixos Mensais (Operação enxuta)

| Item | Custo Mensal |
|------|-------------|
| Servidor (AWS/Google Cloud) | R$ 2.000 |
| MongoDB Atlas | R$ 500 |
| Stripe (fixo) | R$ 100 |
| Domínio + SSL | R$ 50 |
| Ferramentas (Slack, etc) | R$ 300 |
| **Subtotal Infraestrutura** | **R$ 2.950** |

| Item | Custo Mensal |
|------|-------------|
| Suporte ao Cliente (1 pessoa) | R$ 3.000 |
| Verificação de Cuidadores (1 pessoa) | R$ 2.500 |
| Marketing Digital (básico) | R$ 2.000 |
| Contador | R$ 800 |
| **Subtotal Operações** | **R$ 8.300** |

### **TOTAL CUSTO FIXO: R$ 11.250/mês**

### 2.2 Custos Variáveis

| Item | % sobre receita |
|------|----------------|
| Gateway de pagamento (Stripe) | 3,5% + R$ 0,40 |
| Background Check (parceiro) | R$ 15/verificação |
| SMS/Notificações | R$ 0,05/mensagem |

---

## 3. CENÁRIOS DE PROJEÇÃO

### 3.1 ANO 1 - Lançamento (Conservador)

**Premissas:**
- Início com MS (Mato Grosso do Sul)
- 500 cuidadores cadastrados
- 200 cuidadores ativos
- 4 agendamentos/cuidador/mês

| Mês | Agendamentos | Receita Bruta | Custos | Lucro/Prejuízo |
|-----|--------------|---------------|--------|----------------|
| 1-3 | 200/mês | R$ 8.400 | R$ 15.000 | -R$ 6.600 |
| 4-6 | 500/mês | R$ 21.000 | R$ 15.000 | +R$ 6.000 |
| 7-9 | 1.000/mês | R$ 42.000 | R$ 18.000 | +R$ 24.000 |
| 10-12 | 2.000/mês | R$ 84.000 | R$ 22.000 | +R$ 62.000 |

**Resultado Ano 1:**
- Receita Total: ~R$ 600.000
- Custos Totais: ~R$ 200.000
- **Lucro Líquido: ~R$ 400.000** (após investimento inicial)

### 3.2 ANO 2 - Expansão

**Premissas:**
- Expansão para SP, RJ, MG
- 2.000 cuidadores ativos
- 8 agendamentos/cuidador/mês

| Trimestre | Agendamentos/mês | Receita Mensal | Lucro Mensal |
|-----------|------------------|----------------|---------------|
| Q1 | 5.000 | R$ 210.000 | R$ 80.000 |
| Q2 | 8.000 | R$ 336.000 | R$ 150.000 |
| Q3 | 12.000 | R$ 504.000 | R$ 250.000 |
| Q4 | 16.000 | R$ 672.000 | R$ 350.000 |

**Resultado Ano 2:**
- Receita Total: ~R$ 5.000.000
- **Lucro Líquido: ~R$ 2.000.000**
- **Margem: 40%**

### 3.3 ANO 3-5 - Escala Nacional

| Ano | Cuidadores | Agendamentos/mês | Receita Anual | Lucro |
|-----|------------|------------------|---------------|-------|
| 3 | 5.000 | 40.000 | R$ 20M | R$ 6M |
| 4 | 10.000 | 80.000 | R$ 40M | R$ 14M |
| 5 | 20.000 | 160.000 | R$ 80M | R$ 30M |

---

## 4. MÉTRICAS-CHAVE (UNIT ECONOMICS)

### 4.1 Por Família (Cliente)

```
Lifetime Value (LTV) - Família
├── Tempo médio como cliente: 18 meses
├── Agendamentos por mês: 4
├── Ticket médio: R$ 280
├── Taxa SeniorCare: R$ 42
└── LTV = 18 x 4 x R$ 42 = R$ 3.024

Custo de Aquisição (CAC) - Família
├── Google Ads: R$ 50
├── Indicação (bônus): R$ 30
└── CAC médio: R$ 80

LTV/CAC = R$ 3.024 / R$ 80 = 37,8x ✅ (excelente!)
```

### 4.2 Por Cuidador

```
Lifetime Value (LTV) - Cuidador
├── Tempo médio ativo: 24 meses
├── Agendamentos por mês: 8
├── Receita média por agendamento: R$ 42
├── Assinatura Premium (40%): R$ 19,60/mês
└── LTV = (24 x 8 x R$ 42) + (24 x R$ 19,60) = R$ 8.534

Custo de Aquisição (CAC) - Cuidador
├── Verificação: R$ 15
├── Marketing: R$ 35
└── CAC médio: R$ 50

LTV/CAC = R$ 8.534 / R$ 50 = 170,7x ✅ (excepcional!)
```

---

## 5. PONTO DE EQUILÍBRIO (BREAK-EVEN)

### Cálculo:

```
Custo Fixo Mensal: R$ 11.250
Receita por Agendamento: R$ 42 (média)
Custo Variável por Agendamento: R$ 4 (~10%)
Contribuição por Agendamento: R$ 38

Break-even = R$ 11.250 / R$ 38 = 296 agendamentos/mês

Com 100 cuidadores fazendo 3 agendamentos/mês = 300 agendamentos ✅
```

### **Break-even atingido com apenas 100 cuidadores ativos!**

---

## 6. COMPARATIVO COM MERCADO

### 6.1 Margens do Setor

| Empresa/Modelo | Taxa | Nossa vantagem |
|----------------|------|----------------|
| Agências tradicionais | 30-50% | 2-3x mais barato |
| GetNinjas | 20% | 25% mais barato |
| Care.com (EUA) | 20-35% | Referência |
| **SeniorCare+** | **15%** | **Mais competitivo** |

### 6.2 Valuations de Referência

| Empresa | Valuation | Receita | Múltiplo |
|---------|-----------|---------|----------|
| Care.com (exit) | $500M | $200M | 2,5x |
| Honor (EUA) | $1.25B | $150M | 8x |
| Hometeam (EUA) | $50M | $20M | 2,5x |

**Projeção SeniorCare+ (Ano 5):**
- Receita: R$ 80M
- Múltiplo conservador: 3x
- **Valuation potencial: R$ 240M (~$45M USD)**

---

## 7. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Concorrente grande entrar | Média | Alto | First-mover advantage, network effect |
| Cuidador causar problema | Baixa | Alto | Seguro, verificação rigorosa, escrow |
| Regulamentação | Baixa | Médio | Compliance desde o início |
| Dificuldade de escalar | Média | Médio | Automação, processos bem definidos |

---

## 8. RETORNO PARA INVESTIDOR

### Cenário: Investimento de R$ 500.000 por 12% equity

| Cenário | Ano 5 Valuation | Valor da Participação | Retorno |
|---------|-----------------|----------------------|--------|
| Pessimista | R$ 50M | R$ 6M | 12x |
| Base | R$ 150M | R$ 18M | 36x |
| Otimista | R$ 300M | R$ 36M | 72x |

### TIR (Taxa Interna de Retorno): 65-120% ao ano

---

## 9. CONCLUSÃO

### Por que SeniorCare+ é um bom investimento:

1. ✅ **Mercado grande e crescente** (R$ 84B, +12%/ano)
2. ✅ **Unit economics excelentes** (LTV/CAC > 35x)
3. ✅ **Break-even baixo** (100 cuidadores)
4. ✅ **MVP funcional** (reduz risco de execução)
5. ✅ **Margens altas** (40%+ após escala)
6. ✅ **Barreiras de entrada** (network effect, dados)
7. ✅ **Múltiplos exits possíveis** (aquisição, IPO)

---

*Análise preparada em Janeiro/2025*
*Todos os números são projeções baseadas em benchmarks de mercado*
