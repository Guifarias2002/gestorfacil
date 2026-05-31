import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const COR = {
  sidebar: '#0f172a',
  accent: '#0ea5e9',
  accentClaro: '#38bdf8',
  bg: '#f1f5f9',
  card: '#fff',
  verde: '#10b981',
  vermelho: '#ef4444',
  amarelo: '#f59e0b',
  texto: '#0f172a',
  textoClaro: '#64748b',
}

export default function App() {
  const [aba, setAba] = useState('painel')
  const [produtos, setProdutos] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [loadingP, setLoadingP] = useState(true)
  const [loadingL, setLoadingL] = useState(true)
  const [addProd, setAddProd] = useState(false)
  const [addCaixa, setAddCaixa] = useState(false)
  const [formProd, setFormProd] = useState({ nome:'', categoria:'', fornecedor:'', preco_venda:'', custo_unitario:'', estoque_atual:'', estoque_minimo:'' })
  const [formCaixa, setFormCaixa] = useState({ descricao:'', tipo:'entrada', valor:'', categoria:'Venda' })

  useEffect(() => { buscarProdutos(); buscarLancamentos() }, [])

  async function buscarProdutos() {
    setLoadingP(true)
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    setProdutos(data || [])
    setLoadingP(false)
  }

  async function buscarLancamentos() {
    setLoadingL(true)
    const { data } = await supabase.from('lancamentos').select('*').order('created_at', { ascending: false })
    setLancamentos(data || [])
    setLoadingL(false)
  }

  async function salvarProduto() {
    if (!formProd.nome) return alert('Informe o nome do produto')
    await supabase.from('produtos').insert([{
      nome: formProd.nome.toUpperCase(),
      categoria: formProd.categoria,
      fornecedor: formProd.fornecedor,
      preco_venda: parseFloat(formProd.preco_venda) || 0,
      custo_unitario: parseFloat(formProd.custo_unitario) || 0,
      estoque_atual: parseInt(formProd.estoque_atual) || 0,
      estoque_minimo: parseInt(formProd.estoque_minimo) || 0,
    }])
    setFormProd({ nome:'', categoria:'', fornecedor:'', preco_venda:'', custo_unitario:'', estoque_atual:'', estoque_minimo:'' })
    setAddProd(false)
    buscarProdutos()
  }

  async function salvarLancamento() {
    if (!formCaixa.descricao || !formCaixa.valor) return alert('Preencha descrição e valor')
    await supabase.from('lancamentos').insert([{
      descricao: formCaixa.descricao,
      tipo: formCaixa.tipo,
      valor: parseFloat(formCaixa.valor),
      categoria: formCaixa.categoria,
      data: new Date().toISOString().split('T')[0]
    }])
    setFormCaixa({ descricao:'', tipo:'entrada', valor:'', categoria:'Venda' })
    setAddCaixa(false)
    buscarLancamentos()
  }

  async function deletarProduto(id) {
    if (!confirm('Excluir produto?')) return
    await supabase.from('produtos').delete().eq('id', id)
    buscarProdutos()
  }

  async function deletarLancamento(id) {
    if (!confirm('Excluir lançamento?')) return
    await supabase.from('lancamentos').delete().eq('id', id)
    buscarLancamentos()
  }

  const totalEntradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((a, l) => a + Number(l.valor), 0)
  const totalSaidas = lancamentos.filter(l => l.tipo === 'saida').reduce((a, l) => a + Number(l.valor), 0)
  const saldo = totalEntradas - totalSaidas
  const produtosBaixos = produtos.filter(p => p.estoque_atual <= p.estoque_minimo)
  const margem = p => p.preco_venda > 0 ? Math.round(((p.preco_venda - p.custo_unitario) / p.preco_venda) * 100) : 0
  const fmt = v => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  const navItems = [
    { id: 'painel', label: 'Painel', icon: '▦' },
    { id: 'estoque', label: 'Estoque', icon: '📦' },
    { id: 'caixa', label: 'Fluxo de Caixa', icon: '💰' },
  ]

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:COR.bg, fontFamily:"'Segoe UI', sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{ width:220, background:COR.sidebar, display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, height:'100vh', zIndex:100 }}>
        <div style={{ padding:'28px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#fff', letterSpacing:1 }}>
            <span style={{ color:COR.accentClaro }}>Gestor</span>Fácil
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>Loja da Carla</div>
        </div>
        <nav style={{ padding:'16px 0', flex:1 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => setAba(item.id)} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 20px', cursor:'pointer',
              background: aba===item.id ? 'rgba(14,165,233,0.15)' : 'transparent',
              borderLeft: aba===item.id ? `3px solid ${COR.accentClaro}` : '3px solid transparent',
              color: aba===item.id ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize:14, transition:'all 0.2s'
            }}>
              <span style={{ fontSize:16 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>v1.0 · GestorFácil</div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ marginLeft:220, flex:1, display:'flex', flexDirection:'column' }}>

        {/* HEADER */}
        <div style={{ background:'#fff', padding:'16px 32px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:COR.texto }}>{navItems.find(n => n.id===aba)?.label}</div>
            <div style={{ fontSize:12, color:COR.textoClaro }}>{new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {produtosBaixos.length > 0 && (
              <div style={{ background:'#fef3c7', color:'#92400e', fontSize:12, padding:'5px 12px', borderRadius:99, fontWeight:600 }}>
                ⚠️ {produtosBaixos.length} alerta{produtosBaixos.length > 1 ? 's' : ''}
              </div>
            )}
            <div style={{ width:36, height:36, borderRadius:'50%', background:COR.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>C</div>
          </div>
        </div>

        <div style={{ padding:32, flex:1 }}>

          {/* PAINEL */}
          {aba === 'painel' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:16, marginBottom:24 }}>
                {[
                  { label:'Saldo do Mês', valor:'R$ '+fmt(saldo), cor:saldo>=0?COR.verde:COR.vermelho, icon:'💳', sub:'mês corrente' },
                  { label:'Total Entradas', valor:'R$ '+fmt(totalEntradas), cor:COR.verde, icon:'📈', sub:lancamentos.filter(l=>l.tipo==='entrada').length+' lançamentos' },
                  { label:'Total Saídas', valor:'R$ '+fmt(totalSaidas), cor:COR.vermelho, icon:'📉', sub:lancamentos.filter(l=>l.tipo==='saida').length+' lançamentos' },
                  { label:'Produtos', valor:produtos.length, cor:COR.accent, icon:'📦', sub:produtosBaixos.length+' com estoque baixo' },
                ].map(m => (
                  <div key={m.label} style={{ background:COR.card, borderRadius:12, padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderTop:`4px solid ${m.cor}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:12, color:COR.textoClaro, marginBottom:6, fontWeight:500 }}>{m.label}</div>
                        <div style={{ fontSize:24, fontWeight:700, color:m.cor }}>{m.valor}</div>
                        <div style={{ fontSize:11, color:COR.textoClaro, marginTop:4 }}>{m.sub}</div>
                      </div>
                      <span style={{ fontSize:28 }}>{m.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {produtosBaixos.length > 0 && (
                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'14px 20px', marginBottom:24 }}>
                  <div style={{ fontWeight:600, color:'#92400e', marginBottom:8, fontSize:13 }}>⚠️ Produtos com estoque baixo</div>
                  {produtosBaixos.map(p => (
                    <div key={p.id} style={{ fontSize:13, color:'#78350f', padding:'4px 0' }}>
                      • <strong>{p.nome}</strong> — {p.estoque_atual} un (mínimo: {p.estoque_minimo})
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ background:COR.card, borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:COR.texto, marginBottom:16 }}>Últimos lançamentos</div>
                  {lancamentos.slice(0,5).map(l => (
                    <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:COR.texto }}>{l.descricao}</div>
                        <div style={{ fontSize:11, color:COR.textoClaro }}>{l.categoria}</div>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:l.tipo==='entrada'?COR.verde:COR.vermelho }}>
                        {l.tipo==='entrada'?'+':'-'} R$ {fmt(l.valor)}
                      </div>
                    </div>
                  ))}
                  {lancamentos.length===0 && <div style={{ fontSize:13, color:COR.textoClaro, textAlign:'center', padding:20 }}>Nenhum lançamento ainda</div>}
                </div>

                <div style={{ background:COR.card, borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:COR.texto, marginBottom:16 }}>Produtos em destaque</div>
                  {produtos.slice(0,5).map(p => (
                    <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:COR.texto }}>{p.nome}</div>
                        <div style={{ fontSize:11, color:COR.textoClaro }}>{p.categoria}</div>
                      </div>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, fontWeight:600,
                        background:p.estoque_atual===0?'#fee2e2':p.estoque_atual<=p.estoque_minimo?'#fef3c7':'#d1fae5',
                        color:p.estoque_atual===0?'#991b1b':p.estoque_atual<=p.estoque_minimo?'#92400e':'#065f46'
                      }}>{p.estoque_atual===0?'Zerado':p.estoque_atual<=p.estoque_minimo?'Baixo':'OK'}</span>
                    </div>
                  ))}
                  {produtos.length===0 && <div style={{ fontSize:13, color:COR.textoClaro, textAlign:'center', padding:20 }}>Nenhum produto ainda</div>}
                </div>
              </div>
            </div>
          )}

          {/* ESTOQUE */}
          {aba === 'estoque' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
                <button onClick={() => setAddProd(!addProd)} style={{ padding:'10px 20px', borderRadius:8, border:'none', background:COR.accent, color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                  + Adicionar Produto
                </button>
              </div>

              {addProd && (
                <div style={{ background:COR.card, borderRadius:12, padding:24, marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:COR.texto, marginBottom:16 }}>Novo Produto</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {[['nome','Nome do produto'],['categoria','Categoria'],['fornecedor','Fornecedor'],['preco_venda','Preço de venda (R$)'],['custo_unitario','Custo unitário (R$)'],['estoque_atual','Estoque atual'],['estoque_minimo','Estoque mínimo']].map(([k,l]) => (
                      <div key={k}>
                        <div style={{ fontSize:12, color:COR.textoClaro, marginBottom:4, fontWeight:500 }}>{l}</div>
                        <input value={formProd[k]} onChange={e => setFormProd({...formProd,[k]:e.target.value})}
                          style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
                    <button onClick={() => setAddProd(false)} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid #e2e8f0', background:'transparent', cursor:'pointer', fontSize:13 }}>Cancelar</button>
                    <button onClick={salvarProduto} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:COR.accent, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Salvar Produto</button>
                  </div>
                </div>
              )}

              <div style={{ background:COR.card, borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                {loadingP ? <div style={{ textAlign:'center', padding:48, color:COR.textoClaro }}>Carregando...</div> : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#f8fafc' }}>
                        {['Produto','Categoria','Fornecedor','Venda','Custo','Margem','Estoque','Status',''].map(h => (
                          <th key={h} style={{ textAlign:'left', padding:'12px 16px', color:COR.textoClaro, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #f1f5f9' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {produtos.length===0 ? (
                        <tr><td colSpan={9} style={{ textAlign:'center', padding:48, color:COR.textoClaro }}>Nenhum produto cadastrado.</td></tr>
                      ) : produtos.map(p => (
                        <tr key={p.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                          <td style={{ padding:'14px 16px', fontWeight:600, color:COR.texto }}>{p.nome}</td>
                          <td style={{ padding:'14px 16px', color:COR.textoClaro }}>{p.categoria}</td>
                          <td style={{ padding:'14px 16px', color:COR.textoClaro }}>{p.fornecedor}</td>
                          <td style={{ padding:'14px 16px' }}>R$ {fmt(p.preco_venda)}</td>
                          <td style={{ padding:'14px 16px' }}>R$ {fmt(p.custo_unitario)}</td>
                          <td style={{ padding:'14px 16px', fontWeight:600, color:margem(p)>20?COR.verde:COR.amarelo }}>{margem(p)}%</td>
                          <td style={{ padding:'14px 16px' }}>{p.estoque_atual} / {p.estoque_minimo}</td>
                          <td style={{ padding:'14px 16px' }}>
                            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:99, fontWeight:600,
                              background:p.estoque_atual===0?'#fee2e2':p.estoque_atual<=p.estoque_minimo?'#fef3c7':'#d1fae5',
                              color:p.estoque_atual===0?'#991b1b':p.estoque_atual<=p.estoque_minimo?'#92400e':'#065f46'
                            }}>{p.estoque_atual===0?'Zerado':p.estoque_atual<=p.estoque_minimo?'Baixo':'OK'}</span>
                          </td>
                          <td style={{ padding:'14px 16px' }}>
                            <button onClick={() => deletarProduto(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', fontSize:16 }}>🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* CAIXA */}
          {aba === 'caixa' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
                {[
                  { label:'Total Entradas', valor:'R$ '+fmt(totalEntradas), cor:COR.verde },
                  { label:'Total Saídas', valor:'R$ '+fmt(totalSaidas), cor:COR.vermelho },
                  { label:'Saldo', valor:'R$ '+fmt(saldo), cor:saldo>=0?COR.verde:COR.vermelho },
                ].map(m => (
                  <div key={m.label} style={{ background:COR.card, borderRadius:12, padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderTop:`4px solid ${m.cor}` }}>
                    <div style={{ fontSize:12, color:COR.textoClaro, marginBottom:6, fontWeight:500 }}>{m.label}</div>
                    <div style={{ fontSize:26, fontWeight:700, color:m.cor }}>{m.valor}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
                <button onClick={() => setAddCaixa(!addCaixa)} style={{ padding:'10px 20px', borderRadius:8, border:'none', background:COR.accent, color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                  + Novo Lançamento
                </button>
              </div>

              {addCaixa && (
                <div style={{ background:COR.card, borderRadius:12, padding:24, marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:COR.texto, marginBottom:16 }}>Novo Lançamento</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <div style={{ fontSize:12, color:COR.textoClaro, marginBottom:4, fontWeight:500 }}>Descrição</div>
                      <input value={formCaixa.descricao} onChange={e => setFormCaixa({...formCaixa,descricao:e.target.value})}
                        style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, boxSizing:'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:COR.textoClaro, marginBottom:4, fontWeight:500 }}>Tipo</div>
                      <select value={formCaixa.tipo} onChange={e => setFormCaixa({...formCaixa,tipo:e.target.value})}
                        style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13 }}>
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:COR.textoClaro, marginBottom:4, fontWeight:500 }}>Valor (R$)</div>
                      <input type="number" value={formCaixa.valor} onChange={e => setFormCaixa({...formCaixa,valor:e.target.value})}
                        style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, boxSizing:'border-box' }} />
                    </div>
                    <div>
                      <div style={{ fontSize:12, color:COR.textoClaro, marginBottom:4, fontWeight:500 }}>Categoria</div>
                      <select value={formCaixa.categoria} onChange={e => setFormCaixa({...formCaixa,categoria:e.target.value})}
                        style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13 }}>
                        <option>Venda</option>
                        <option>Compra/Reposição</option>
                        <option>Salário/Pró-labore</option>
                        <option>Aluguel</option>
                        <option>Outros</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:16 }}>
                    <button onClick={() => setAddCaixa(false)} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid #e2e8f0', background:'transparent', cursor:'pointer', fontSize:13 }}>Cancelar</button>
                    <button onClick={salvarLancamento} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:COR.accent, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Salvar</button>
                  </div>
                </div>
              )}

              <div style={{ background:COR.card, borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                {loadingL ? <div style={{ textAlign:'center', padding:48, color:COR.textoClaro }}>Carregando...</div> : (
                  <div>
                    {lancamentos.length===0 ? (
                      <div style={{ textAlign:'center', padding:48, color:COR.textoClaro }}>Nenhum lançamento ainda.</div>
                    ) : lancamentos.map(l => (
                      <div key={l.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:'1px solid #f1f5f9' }}>
                        <div style={{ width:38, height:38, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, background:l.tipo==='entrada'?'#d1fae5':'#fee2e2', flexShrink:0 }}>
                          {l.tipo==='entrada'?'↓':'↑'}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:COR.texto }}>{l.descricao}</div>
                          <div style={{ fontSize:12, color:COR.textoClaro }}>{l.categoria} · {new Date(l.data+'T12:00:00').toLocaleDateString('pt-BR')}</div>
                        </div>
                        <div style={{ fontSize:15, fontWeight:700, color:l.tipo==='entrada'?COR.verde:COR.vermelho }}>
                          {l.tipo==='entrada'?'+':'-'} R$ {fmt(l.valor)}
                        </div>
                        <button onClick={() => deletarLancamento(l.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#cbd5e1', fontSize:16 }}>🗑</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}