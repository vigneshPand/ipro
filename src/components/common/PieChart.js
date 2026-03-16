import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../../utils/theme';

const PieChart = ({ slices, total, radius = 28, strokeWidth = 56, emptyColor = COLORS.grayBg }) => {
    const size = radius * 2 + strokeWidth;
    const center = size / 2;

    if (total === 0 || !slices || slices.length === 0) {
        return (
            <Svg width={size} height={size}>
                <Circle cx={center} cy={center} r={size / 2} fill={emptyColor} />
            </Svg>
        );
    }

    const circ = 2 * Math.PI * radius;

    // Sort so base layers (if any) render first underneath, then stacked on top
    const baseLayer = slices.find(s => s.isBase);
    const topLayers = slices.filter(s => !s.isBase && s.value > 0);

    let currentOffset = 0;

    return (
        <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
                {/* Render Base Layer spanning full circle */}
                {baseLayer && (
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke={baseLayer.color}
                        strokeWidth={strokeWidth}
                    />
                )}

                {/* Render Top Layers sequentially */}
                {topLayers.map((slice, index) => {
                    const ratio = slice.value / total;
                    const strokeDash = ratio * circ;
                    const renderOffset = currentOffset;

                    // Increment offset for the next slice (negative pushes it backwards smoothly)
                    currentOffset -= strokeDash;

                    return (
                        <Circle
                            key={index}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${strokeDash} ${circ}`}
                            strokeDashoffset={renderOffset}
                        />
                    );
                })}
            </G>
        </Svg>
    );
};

export default PieChart;
