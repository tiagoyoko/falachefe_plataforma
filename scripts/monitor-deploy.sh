#!/bin/bash
# Monitor de Deploy Vercel
# ========================

echo "🚀 MONITOR DE DEPLOY - VERCEL"
echo "=============================="
echo ""

DEPLOYMENT_ID="dpl_EYbg2BJYLaz2Ra58msiLKDDXx2ZW"
INSPECTOR_URL="https://vercel.com/tiago-6739s-projects/falachefe/EYbg2BJYLaz2Ra58msiLKDDXx2ZW"
PREVIEW_URL="https://falachefe-71jxjdxo3-tiago-6739s-projects.vercel.app"

echo "📦 Deployment ID: $DEPLOYMENT_ID"
echo "🔍 Inspector: $INSPECTOR_URL"
echo "🌐 Preview URL: $PREVIEW_URL"
echo ""
echo "⏳ Aguardando conclusão do deploy..."
echo ""
echo "💡 Dica: Abra o Inspector URL no navegador para acompanhar em tempo real!"
echo ""
echo "---"
echo ""
echo "Para verificar status manualmente:"
echo "  vercel ls"
echo ""
echo "Para ver logs do build:"
echo "  vercel logs $DEPLOYMENT_ID"
echo ""

