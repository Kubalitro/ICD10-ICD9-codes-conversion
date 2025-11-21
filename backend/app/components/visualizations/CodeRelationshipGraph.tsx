'use client';

import React from 'react';
import {
    ResponsiveContainer,
    Treemap,
    Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { ICDCode, ConversionResult } from '../../types';
import { fadeIn } from '../../utils/animations';

interface CodeRelationshipGraphProps {
    sourceCode: ICDCode;
    conversions: ConversionResult[];
}

const CodeRelationshipGraph: React.FC<CodeRelationshipGraphProps> = ({ sourceCode, conversions }) => {
    // Transform data for Treemap
    // We group conversions by match type (Exact, Approximate, etc.)
    const data = [
        {
            name: 'Source',
            children: [
                { name: sourceCode.code, size: 1000, type: 'Source' }
            ]
        },
        {
            name: 'Targets',
            children: conversions.map(c => ({
                name: c.targetCode,
                size: 500,
                type: c.approximate ? 'Approximate' : (c.noMap ? 'No Map' : 'Exact'),
                desc: c.description
            }))
        }
    ];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg text-sm">
                    <p className="font-bold text-gray-900 dark:text-gray-100">{data.name}</p>
                    {data.desc && <p className="text-gray-600 dark:text-gray-400 mt-1">{data.desc}</p>}
                    {data.type && <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 uppercase">{data.type}</p>}
                </div>
            );
        }
        return null;
    };

    const CustomContent = (props: any) => {
        const { root, depth, x, y, width, height, index, payload, colors, rank, name } = props;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: depth < 2 ? '#3b82f6' : '#ffffff00',
                        stroke: '#fff',
                        strokeWidth: 2 / (depth + 1e-10),
                        strokeOpacity: 1 / (depth + 1e-10),
                    }}
                />
                {depth === 1 ? (
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 7}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={14}
                    >
                        {name}
                    </text>
                ) : null}
                {depth === 1 ? (
                    <text
                        x={x + 4}
                        y={y + 18}
                        fill="#fff"
                        fontSize={16}
                        fillOpacity={0.9}
                    >
                        {index + 1}
                    </text>
                ) : null}
            </g>
        );
    };

    return (
        <motion.div
            variants={fadeIn}
            className="w-full h-[300px] bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Visual Relationship Map
            </h3>
            <ResponsiveContainer width="100%" height="100%">
                <Treemap
                    width={400}
                    height={200}
                    data={data}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    fill="#3b82f6"
                    content={<CustomContent />}
                >
                    <Tooltip content={<CustomTooltip />} />
                </Treemap>
            </ResponsiveContainer>
        </motion.div>
    );
};

export default CodeRelationshipGraph;
