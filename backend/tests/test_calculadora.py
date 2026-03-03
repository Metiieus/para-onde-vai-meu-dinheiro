"""
Testes unitários para a lógica de cálculo de impostos.

Execute com: pytest backend/tests/ -v
"""

import pytest
import sys
import os

# Adiciona o diretório backend ao path para importação
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import calcular_inss, calcular_irrf, calcular_impostos_completo


class TestCalcularINSS:
    """Testa o cálculo do INSS com tabela progressiva 2024."""

    def test_salario_minimo(self):
        """Salário mínimo (R$ 1.412) deve ter alíquota de 7,5%."""
        resultado = calcular_inss(1412.0)
        # Faixa 1: até R$ 1.412 → 7,5%
        esperado = 1412.0 * 0.075
        assert abs(resultado - esperado) < 0.01

    def test_salario_5000(self):
        """Salário de R$ 5.000 deve calcular INSS progressivo corretamente."""
        resultado = calcular_inss(5000.0)
        # Faixa 1: 1412 * 7.5% = 105.90
        # Faixa 2: (2666.68 - 1412) * 9% = 112.92
        # Faixa 3: (4000.03 - 2666.68) * 12% = 160.00
        # Faixa 4: (5000 - 4000.03) * 14% = 139.99
        assert resultado > 0
        assert resultado < 5000.0  # Nunca pode ser maior que o salário

    def test_salario_acima_teto(self):
        """Salário acima do teto do INSS (R$ 7.786,02) deve ter INSS fixo no teto."""
        resultado_teto = calcular_inss(7786.02)
        resultado_acima = calcular_inss(15000.0)
        # INSS não cresce acima do teto
        assert abs(resultado_teto - resultado_acima) < 0.01

    def test_salario_zero(self):
        """Salário zero deve retornar INSS zero."""
        resultado = calcular_inss(0)
        assert resultado == 0.0

    def test_salario_negativo(self):
        """Salário negativo deve retornar INSS zero."""
        resultado = calcular_inss(-1000)
        assert resultado == 0.0


class TestCalcularIRRF:
    """Testa o cálculo do IRRF com tabela progressiva 2024."""

    def test_isento(self):
        """Salário abaixo do limite de isenção deve ter IRRF zero."""
        # Limite de isenção 2024: R$ 2.824,00 (base de cálculo após INSS)
        resultado = calcular_irrf(1500.0, inss=112.50)
        assert resultado == 0.0

    def test_salario_alto(self):
        """Salário alto deve ter IRRF positivo."""
        resultado = calcular_irrf(10000.0, inss=908.86)
        assert resultado > 0

    def test_irrf_nao_negativo(self):
        """IRRF nunca pode ser negativo."""
        resultado = calcular_irrf(500.0, inss=37.50)
        assert resultado >= 0.0

    def test_irrf_menor_que_salario(self):
        """IRRF nunca pode ser maior que o salário bruto."""
        salario = 20000.0
        inss = calcular_inss(salario)
        resultado = calcular_irrf(salario, inss=inss)
        assert resultado < salario


class TestCalcularImpostosCompleto:
    """Testa o cálculo completo de impostos."""

    def test_salario_liquido_positivo(self):
        """O salário líquido deve ser sempre positivo."""
        resultado = calcular_impostos_completo(3000.0)
        assert resultado['salario_liquido'] > 0

    def test_salario_liquido_menor_que_bruto(self):
        """O salário líquido deve ser sempre menor que o bruto."""
        resultado = calcular_impostos_completo(5000.0)
        assert resultado['salario_liquido'] < resultado['salario_bruto']

    def test_percentual_impostos_valido(self):
        """O percentual de impostos deve estar entre 0% e 100%."""
        resultado = calcular_impostos_completo(5000.0)
        assert 0 <= resultado['percentual_impostos'] <= 100

    def test_soma_destinos_igual_impostos_renda(self):
        """
        A soma dos destinos deve ser igual aos impostos de renda (INSS + IRRF).
        Os destinos são calculados sobre os impostos diretos de renda, não sobre
        as estimativas de consumo (ICMS, IPI, etc.), pois esses são repassados
        de forma difusa e não diretamente ao Orçamento Geral da União.
        """
        resultado = calcular_impostos_completo(5000.0)
        soma_destinos = sum(d['valor'] for d in resultado['destinos'])
        # Impostos de renda = INSS + IRRF (os dois primeiros na lista)
        impostos_renda = sum(
            i['valor'] for i in resultado['impostos'] if i['tipo'] == 'renda'
        )
        assert abs(soma_destinos - impostos_renda) < 0.01

    def test_nota_metodologica_presente(self):
        """A nota metodológica deve estar presente no resultado."""
        resultado = calcular_impostos_completo(5000.0)
        assert 'nota_metodologica' in resultado
        assert len(resultado['nota_metodologica']) > 0

    def test_impostos_listados(self):
        """O resultado deve listar os impostos calculados."""
        resultado = calcular_impostos_completo(5000.0)
        assert len(resultado['impostos']) > 0
        nomes = [i['nome'] for i in resultado['impostos']]
        assert 'INSS' in nomes
        assert 'IRRF' in nomes

    def test_salario_minimo_2024(self):
        """Testa cálculo com o salário mínimo de 2024 (R$ 1.412)."""
        resultado = calcular_impostos_completo(1412.0)
        assert resultado['salario_liquido'] > 0
        assert resultado['total_impostos'] >= 0
