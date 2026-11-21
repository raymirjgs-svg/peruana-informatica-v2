'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface SalesChartProps {
    data: Array<{
        date: string;
        revenue: string;
        orders: number;
    }>;
}

export function SalesChart({ data }: SalesChartProps) {
    const chartData = {
        labels: data.map(d => new Date(d.date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Ingresos cobrados (S/)',
                data: data.map(d => parseFloat(d.revenue)),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Pedidos recibidos',
                data: data.map(d => d.orders),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                yAxisID: 'y1',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: { boxWidth: 12, font: { size: 11 } }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                position: 'left' as const,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            y1: {
                beginAtZero: true,
                position: 'right' as const,
                grid: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return <Line data={chartData} options={options} />;
}
