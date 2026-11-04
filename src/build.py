import json, re, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(__import__('os').path.join(ROOT,'src/standard.py')).read()
head = src[:src.index('# (types are assembled')]
ns = {}
exec(head, ns)  # defines STD, ORDER, FAM_EXTRA, CUT_EXTRA, PROMPT_EXTRA, D
STD, ORDER, FAM_EXTRA, CUT_EXTRA, PROMPT_EXTRA = ns['STD'], ns['ORDER'], ns['FAM_EXTRA'], ns['CUT_EXTRA'], ns['PROMPT_EXTRA']
D = json.load(open(os.path.join(ROOT,'src/data_v3.json')))

byid = {t['id']: t for t in D['types']}
types = []
for i, tid in enumerate(ORDER):
    t = dict(byid[tid])
    if tid in STD:
        s = STD[tid]
        t.update(name=s['name'], short=s['short'], fam=s['fam'], prompt=s['prompt'], cut=s['cut'], trap=s['trap'], start=s['start'], startWhy=s['startWhy'], hyp=s['hyp'], risks=s['risks'], std=True)
        t['buckets'] = [{'name': n, 'subs': subs} for n, subs in s['buckets']]
    else:
        t.update(fam=FAM_EXTRA[tid], cut=CUT_EXTRA[tid], prompt=PROMPT_EXTRA[tid], std=False, risks='close')
        t['startWhy'] = t.get('start', '')
        t['buckets'] = [{'name': b['name'], 'subs': b['subs']} for b in t['buckets']]
        names = [b['name'] for b in t['buckets']]
        m = [n for n in names if t['start'].lower().startswith(n.lower()[:8])]
        t['start'] = m[0] if m else names[0]
    t['order'] = i + 1
    t.pop('triggers', None); t.pop('defn', None)
    types.append(t)
for t in types:
    assert t['start'] in [b['name'] for b in t['buckets']], (t['id'], t['start'])

# ---------- Industry primer cards ----------
IND = [
 dict(name='Professional services', one='Sells people\'s time: revenue = heads × utilization × realized rate. Pyramid shape and leverage drive margin; the bench is the silent cost.',
  metrics=['Utilization', 'Realized rate vs bill rate', 'Leverage (partner : staff)', 'Revenue per head'], levers=['Pyramid mix and leverage', 'Utilization and bench', 'Pricing: T&M vs fixed fee', 'Attrition and recruiting cost'],
  themes=['Margin squeeze with full utilization', 'Fixed-fee overruns', 'Entering a new service line', 'Partner productivity'], watch='Fixed-fee hour creep; revenue growth that comes from pyramid flattening (more expensive heads).',
  swaps={'profit': 'Revenue → heads × utilization × realized rate; Costs → cost rate by level, bench, pyramid shape', 'growth': 'Core → wallet share in existing accounts; New markets → new client segments and geographies; New products → new service lines', 'cost': 'Baseline → cost per billable hour by level; Levers → pyramid, offshore delivery, utilization', 'pricing': 'Value & WTP → outcome-based fees; Economics → margin by engagement type'}),
 dict(name='Retail', one='Sells goods through stores and online. Revenue = traffic × conversion × basket; margin = gross margin − occupancy − labor; same-store vs new-store is the first cut.',
  metrics=['Same-store sales growth', 'Sales per square foot', 'Gross margin and shrink', 'Inventory turns'], levers=['Traffic and conversion', 'Basket and attach', 'Occupancy and labor per store', 'Markdowns and shrink'],
  themes=['Profit down with revenue flat (new-store ramp)', 'Online vs store cannibalization', 'Private label launch', 'Store footprint rationalization'], watch='Averages hide mature vs ramping stores; e-commerce growth that shifts, not adds, sales.',
  swaps={'profit': 'Revenue → traffic × conversion × basket, same-store vs new; Costs → occupancy, store labor hours × wage, shrink', 'growth': 'Core → conversion and basket; New markets → new geographies and wholesale; New products → private label', 'ops': 'Demand → footfall by daypart; Capacity → checkout lanes and staff hours; Process → queue and replenishment', 'pricing': 'Competitive position → price index vs discounters; Economics → markdown cadence', 'entry': 'Right to win → brand pull and supply chain into a new region; Economics → store-level payback'}),
 dict(name='Consumer packaged goods', one='Brands sold through retailers. Growth comes from penetration, frequency and price/mix; the retailer owns the shelf, so trade spend and distribution are the levers.',
  metrics=['Household penetration', 'Velocity (units per store per week)', 'Gross-to-net (trade spend)', 'Share of shelf / ACV distribution'], levers=['Price pack architecture', 'Trade spend efficiency', 'Distribution gains', 'Mix shift to premium'],
  themes=['Private-label pressure', 'New product launch and cannibalization', 'Channel shift to e-commerce/club', 'Input-cost inflation pass-through'], watch='Gross vs net revenue (trade spend); a launch that cannibalizes the core SKU.',
  swaps={'profit': 'Revenue → penetration × frequency × price/mix, gross-to-net; Costs → COGS (inputs, packaging), trade and marketing', 'growth': 'Core → penetration and frequency; New markets → channels (club, e-com) and geographies; New products → adjacent categories', 'launch': 'Customer & market → unmet need and household penetration; Economics & risks → cannibalization of the core SKU', 'pricing': 'Value & WTP → price pack architecture; Competitive position → private label price gap'}),
 dict(name='Logistics & transportation', one='Moves goods or people with heavy assets: profit = utilization × yield − cost per unit moved. Network design and asset deployment decide the economics.',
  metrics=['Load factor / utilization', 'Yield (revenue per unit-mile)', 'Cost per mile or per package', 'On-time performance'], levers=['Network density', 'Pricing and surcharges', 'Fuel, labor, maintenance per unit', 'Asset ownership vs leasing'],
  themes=['Full but unprofitable (underpriced)', 'Last-mile cost', 'Fleet electrification investment', 'Route or hub rationalization'], watch='Utilization up with yield down looks like growth and is a price problem.',
  swaps={'profit': 'Revenue → utilization × yield, ancillary fees; Costs → fuel, driver labor, maintenance, ownership per unit', 'ops': 'Demand → volume by lane and peak; Process → hub sort and dwell time; Capacity → vehicles × drivers × hours', 'invest': 'Economics → cost per mile old vs new asset, payback vs fleet life', 'pricing': 'Economics → breakeven volume loss on a surcharge'}),
 dict(name='Financial services', one='Banks and insurers make money on spread, fees and underwriting. Risk is a cost that arrives late; growth that comes from loosening risk looks great for two years.',
  metrics=['Net interest margin', 'Combined ratio (insurance)', 'Cost-to-income ratio', 'Customer acquisition cost and churn'], levers=['Pricing and underwriting', 'Mix (product, channel, risk)', 'Branch and operations cost', 'Digital self-service'],
  themes=['Profit down: underwriting vs expense', 'Branch footprint', 'Digital channel shift', 'Fintech competitive response'], watch='Growth from bad risks; regulatory capital as a constraint on any growth plan.',
  swaps={'profit': 'Revenue → premium or spread × volume, fee income; Costs → claims/losses, acquisition, admin', 'compete': 'What changed → a fintech\'s pricing or model; Why we\'re exposed → switching costs and trust', 'cost': 'Baseline → cost-to-income by function; Levers → branch footprint, automation, offshore ops', 'growth': 'Core → cross-sell products per customer; New markets → segments and digital channels'}),
 dict(name='Automotive', one='Capital-intensive manufacturing with a dealer channel. Fixed-cost absorption makes volume king; mix (trucks vs sedans, options) drives margin.',
  metrics=['Plant utilization', 'Contribution margin per unit', 'Incentive spend per vehicle', 'Dealer inventory days'], levers=['Mix and pricing/incentives', 'Platform sharing and scale', 'Supplier cost', 'Capacity footprint'],
  themes=['Margin erosion with volume decline (absorption)', 'EV investment go/no-go', 'Supplier shock', 'Dealer network consolidation'], watch='Fixed-cost absorption: a 10% volume drop can halve profit; incentives are a hidden price cut.',
  swaps={'profit': 'Revenue → units × net price (after incentives) × mix; Costs → material, conversion, fixed absorption', 'invest': 'Economics → capex per unit of capacity, breakeven volume; Execution → supplier readiness', 'cost': 'Levers → design-to-cost, supplier renegotiation, platform consolidation', 'entry': 'Market → segment growth and regulation (emissions); Right to win → brand and dealer network'}),
 dict(name='Healthcare providers', one='Hospitals and clinics: payers set the price, so the levers are volume, case/payer mix and cost to serve. The charge is fiction; the contract rate is what hits the bank.',
  metrics=['Payer mix', 'Reimbursement per case / visit', 'Length of stay and throughput', 'Labor cost per unit (agency share)'], levers=['Service-line mix', 'Payer contract rates', 'Clinical labor productivity', 'Throughput and capacity'],
  themes=['Margin squeeze', 'ED wait times / boarding', 'Adding a service line or clinic', 'Reimbursement change response'], watch='Price is not a lever; mix is. Boarding fixes sit outside the ED (discharge).',
  swaps={'profit': 'Revenue → volume × case mix × reimbursement by payer; Costs → clinical labor (agency), supplies, LOS', 'ops': 'Demand → acuity and payer mix; Process → triage, bed assignment, provider pickup; Capacity → beds and clinical staff', 'entry': 'Market → covered lives and payer contracts; Right to win → referral relationships', 'ma': 'Target standalone → payer contracts and physician retention; Synergies → shared services, purchasing'}),
 dict(name='Public sector', one='The goal is an outcome, not profit, inside a fixed budget. Demand spikes come from policy, not population; capacity is budget- and hiring-constrained.',
  metrics=['Cost per outcome', 'Funnel conversion (eligible → served)', 'Wait time / backlog', 'Budget variance'], levers=['Channel shift (online, kiosks)', 'Process simplification', 'Eligibility and targeting', 'Procurement and vendors'],
  themes=['Program missing enrollment targets', 'DMV / permit wait times', 'Budget cut without service loss', 'Technology modernization'], watch='Forcing a profit frame; trade-offs, not growth, when the budget is fixed; stakeholders who can veto.',
  swaps={'ops': 'Demand → what changed in the rules (REAL ID, new law); Capacity → budget- and hiring-constrained; Levers → channel shift and appointments', 'cost': 'Baseline → mandated vs discretionary spend; Impact & risk → service standards and political risk', 'public': 'Target population funnel → eligible, aware, applied, enrolled, served', 'invest': 'Strategic fit → mandate and stakeholders; Economics → cost per outcome vs alternatives'}),
 dict(name='Pharma & life sciences', one='High fixed R&D, low marginal cost, patent cliffs. Value sits in the pipeline and in pricing/access; a launch is a market-access problem before a marketing one.',
  metrics=['Peak sales and time to peak', 'Gross-to-net (rebates)', 'Market share by indication', 'Pipeline value (risk-adjusted NPV)'], levers=['Pricing and access (payers, formulary)', 'Lifecycle management', 'Sales force effectiveness', 'Manufacturing and supply'],
  themes=['Loss of exclusivity response', 'Launch sequencing and pricing', 'Licensing / M&A of an asset', 'Sales force sizing'], watch='Rebates make list price meaningless; count probability of technical success in any pipeline value.',
  swaps={'launch': 'Customer & market → patients, prescribers, payers; Economics & risks → gross-to-net, access, cannibalization of own franchise', 'pricing': 'Value & WTP → clinical benefit vs standard of care; Competitive position → formulary tier', 'ma': 'Target standalone → risk-adjusted pipeline NPV; Deal & risks → exclusivity timeline', 'compete': 'What changed → generic or biosimilar entry; Response options → authorized generic, lifecycle extension'}),
 dict(name='Technology, media & telecom', one='Subscription and platform economics: acquisition, retention, expansion. Bookings ≠ revenue ≠ cash; cohorts tell the truth. Content and network costs are the fixed base.',
  metrics=['CAC and payback', 'Churn and net revenue retention', 'ARPU', 'Gross margin / content cost per sub'], levers=['Retention and expansion', 'Pricing tiers and bundling', 'Acquisition efficiency', 'Content/network cost'],
  themes=['Subscription growth slowing', 'Competitor consolidation (why → after-state → response)', 'Pricing tier redesign', 'Platform expansion'], watch='Channel shift ≠ growth; a churn problem disguised as an acquisition problem.',
  swaps={'profit': 'Revenue → subs × ARPU, cohort churn; Costs → content/network (fixed), CAC, support', 'growth': 'Core → ARPU and retention; New markets → geographies and segments; New products → tiers, bundles, ads', 'compete': 'What changed → why the competitor consolidated; Impact on us → market after the deal', 'pricing': 'Value & WTP → elasticity by tier; Execution → grandfathering and bundling'}),
 dict(name='Energy & utilities', one='Commodity exposure or regulated returns. Oil & gas earns on price × volume − lifting cost; utilities earn an allowed return on the asset base. Capital allocation is the case.',
  metrics=['Breakeven price per barrel', 'Lifting / unit cost', 'Allowed ROE and rate base', 'Capacity factor'], levers=['Portfolio and capex allocation', 'Operating cost per unit', 'Hedging', 'Regulatory strategy'],
  themes=['Capex go/no-go under price uncertainty', 'Cost reduction at low prices', 'Renewables entry', 'Asset divestiture'], watch='Commodity price is not a lever; scenario the price deck; regulated returns cap upside.',
  swaps={'invest': 'Economics → NPV across a price deck, breakeven price; Risks → commodity, regulatory, reversibility', 'cost': 'Baseline → lifting cost per unit vs peers; Levers → contractor rates, maintenance, footprint', 'entry': 'Market → policy support and grid access; Right to win → project development capability', 'ma': 'Target standalone → reserves and decline rates; Deal & risks → price assumptions in the bid'}),
 dict(name='Real estate', one='Income = occupancy × rent per unit − operating cost; value = NOI ÷ cap rate. Leverage and interest rates move value more than operations do.',
  metrics=['Occupancy', 'Rent per square foot', 'NOI margin', 'Cap rate'], levers=['Leasing and tenant mix', 'Operating cost', 'Capital improvements', 'Portfolio buy/sell'],
  themes=['Underperforming property', 'Acquisition at a given cap rate', 'Office-to-residential conversion', 'Hotel or lease decision'], watch='A value change from cap-rate compression is not operating improvement; count lease-up time.',
  swaps={'profit': 'Revenue → occupancy × rent, ancillary; Costs → operating, maintenance, taxes', 'invest': 'Economics → NOI ÷ cap rate vs price, lease-up timeline; Alternatives → sell, refinance, convert', 'ma': 'Target standalone → NOI and lease roll; Deal & risks → financing and rate exposure', 'pricing': 'Value & WTP → rent vs comparable properties; Execution → lease terms and concessions'}),
 dict(name='Fashion & apparel', one='Seasonal, trend-driven inventory risk. Full-price sell-through and markdowns decide margin; wholesale vs DTC decides who keeps it.',
  metrics=['Full-price sell-through', 'Markdown rate', 'Gross margin by channel', 'Inventory weeks of supply'], levers=['Assortment and buy depth', 'Channel mix (DTC vs wholesale)', 'Markdown discipline', 'Sourcing cost and speed'],
  themes=['Double revenue (channel and category expansion)', 'Wholesale entry or exit', 'Markdown-driven margin erosion', 'Supply-chain speed investment'], watch='Revenue growth via wholesale at lower margin; distributor margin is not free; cannibalization across channels.',
  swaps={'growth': 'Core → full-price sell-through and store productivity; New markets → wholesale, international; New products → footwear, accessories', 'profit': 'Revenue → units × full-price share × price; Costs → sourcing, markdowns, store occupancy', 'launch': 'Product & competition → trend risk and differentiation; Economics & risks → buy depth and markdown exposure', 'cost': 'Levers → sourcing countries, SKU count, inventory turns'}),
]
for x in IND:
    for k in x['swaps']:
        assert k in ORDER, k

out = dict(types=types, cases=D['cases'], brain=D['brain'], lenses=D['lenses'], math=D['math'], coach=D['coach'], industries=IND)
payload = json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('</script', '<\\/script')
html = open(os.path.join(ROOT,'src/head.html')).read().replace('/*DATA*/', payload) + open(os.path.join(ROOT,'src/core.js')).read() + open(os.path.join(ROOT,'src/modes.js')).read()
open(os.path.join(ROOT,'index.html'), 'w').write(html)
art = html.replace("if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});", '')
open(os.path.join(ROOT,'artifact_index.html'), 'w').write(art)
print('types', len(types), 'industries', len(IND), 'bytes', len(html))
