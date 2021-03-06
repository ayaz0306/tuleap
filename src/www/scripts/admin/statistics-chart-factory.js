/**
 * Copyright (c) Enalean, 2016. All Rights Reserved.
 *
 * This file is a part of Tuleap.
 *
 * Tuleap is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Tuleap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Tuleap; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */
var tuleap    = tuleap || {};
tuleap.charts = tuleap.charts || {};

tuleap.charts.statisticsPieChartFactory =  function (options) {
    options = options || {};

    function chart() {
        tuleap.charts.statisticsPieChart(chart);
        chart.setOptions(options);
        chart.init();
    }

    chart.setOptions = function () {
        chart.width(options.width);
        chart.height(options.height);
        chart.radius(options.radius);
        chart.data(options.data);
        chart.prefix(options.graph_id);
        chart.generalPrefix(options.graph_class);
        chart.divGraph(d3.select('#' + options.graph_id));
    };

    chart.init = function () {
        chart.svg(chart.divGraph().append('svg')
            .attr('width', chart.width())
            .attr('height', chart.height()));

        chart.g(chart.svg().append('g')
            .attr('transform', 'translate(' + (chart.width() / 2) + ',' + (chart.height() / 2) + ')'));

        chart.initArc();
        chart.initPie();
        chart.initGraph();
        chart.initLegend();
        chart.initText();
    };

    chart.initArc = function() {
        var arc = d3.arc()
            .innerRadius(chart.radius() / 4.5)
            .outerRadius(chart.radius() / 3);

        var arc_text = d3.arc()
            .innerRadius(chart.radius() / 3)
            .outerRadius(chart.radius() / 3 + 20);

        var arc_over = d3.arc()
            .innerRadius(chart.radius() / 4.25)
            .outerRadius(chart.radius() / 2.75)
            .padAngle(padAngle);

        var arc_over_text = d3.arc()
            .innerRadius(chart.radius() / 2.75)
            .outerRadius(chart.radius() / 2.75 + 20);

        chart.arc(arc);
        chart.arcText(arc_text);
        chart.arcOver(arc_over);
        chart.arcOverText(arc_over_text);
    };

    chart.initPie = function() {
        var pie = d3.pie()
            .value(function(d) { return d.count; })
            .sort(null);

        chart.pie(pie);
    };

    chart.initLegend = function() {
        var svg_legend = d3.select('#' + getGraphId()).append('div')
            .attr('id', getLegendClass())
            .append('ul')
            .attr('class', getLegendGeneralClass());

        var legend = svg_legend.selectAll('.' + getLegendClass())
            .data(chart.data())
            .enter().append('li')
            .attr('class', function(d) { return getLegendClass() + ' ' + getLegendClassByKey(d.key); });

        legend.append('span')
            .attr('class', function(d) { return getLegendColorSpanClass() + ' ' + getLegendColorClassByKey(d.key); });

        legend.append('span')
            .attr('class', getLegendTextSpanClass())
            .text(function(d) { return d.label; });

        legend.on('mouseover', onOverValue)
            .on('mouseout', onOutValue);

        legend.each(function() {
            var li_width = d3.select(this).node().getBoundingClientRect().width;
            d3.select(this).style('width', li_width + 10 + 'px');
        });

        function onOverValue(d) {
            onSliceAndTextOver(d.key);
            replaceText(chart.g().select('.' + getSliceClassByKey(d.key)).datum());
        }

        function onOutValue(d) {
            onSliceAndTextOut(d.key);
        }
    };

    chart.initGraph = function () {
        var arc_elements = chart.g().selectAll('.' + getSliceClass())
            .data(chart.pie()(chart.data()))
            .enter().append('g')
            .attr('class', function (d) { return  getSliceClass() + ' ' + getSliceClassByKey(d.data.key); });

        arc_elements.append('path')
            .attr('class', getSlicePathClass())
            .attr('d', chart.arc());

        arc_elements.append('text')
            .attr('class', getSliceTextClass())
            .attr('transform', function(d) {
                return 'translate(' + chart.arcText().centroid(d) + ')';
            })
            .attr('dy', '.35em')
            .text(function(d) {
                if (d.value > 0) {
                    return d.value;
                }
            });

        arc_elements.on('mouseover', onOverValue)
            .on('mouseout', onOutValue);

        function onOverValue(d) {
            onSliceAndTextOver(d.data.key);
            replaceText(d);
        }

        function onOutValue(d) {
            onSliceAndTextOut(d.data.key);
        }
    };

    chart.initText = function () {
        d3.selectAll('.' + getSliceClass()).each(function (d) {
            var angle = (d.startAngle + d.endAngle) / 2;

            if (angle > Math.PI) {
                d3.select(this).select('text')
                    .style('text-anchor', 'end');
            } else {
                d3.select(this).select('text')
                    .style('text-anchor', 'start');
            }

            displayText(d);
        });
    };

    chart.redraw = function () {
        chart.svg().attr('width', chart.width())
            .attr('height', chart.height());

        chart.g()
            .attr('transform', 'translate(' + (chart.width()  / 2) + ',' + (chart.height() / 2) + ')');

        chart.initArc();

        chart.g().selectAll('path').attr('d', chart.arc());

        chart.g().selectAll('text').attr('transform', function(d) {
            return 'translate(' + (chart.arcText().centroid(d)) + ')';
        });

        chart.initText();
    };

    function getGraphId() {
        return chart.prefix();
    }

    function getSliceClass() {
        return chart.prefix() + '-slice';
    }

    function getSliceClassByKey(value_key) {
        return chart.prefix() + '-slice-' + value_key;
    }

    function getSlicePathClass() {
        return chart.prefix() + '-slice-path';
    }

    function getSliceTextClass() {
        return chart.prefix() + '-slice-text';
    }

    function getSliceTextUndisplayedClass() {
        return chart.prefix() + '-slice-text-undisplayed';
    }

    function getLegendGeneralClass() {
        return chart.generalPrefix() + '-legend';
    }

    function getLegendClass() {
        return chart.prefix() + '-legend';
    }

    function getLegendClassByKey(value_key) {
        return chart.prefix() + '-legend-' + value_key;
    }

    function getLegendColorClassByKey(value_key) {
        return chart.prefix() + '-legend-color-' + value_key;
    }

    function getLegendColorSpanClass() {
        return chart.prefix() + '-legend-color-span';
    }

    function getLegendTextSpanClass() {
        return chart.prefix() + '-legend-text-span';
    }

    function getLegendSelectedClass() {
        return chart.prefix() + '-legend-selected';
    }

    function displayText(arc_data) {
        var angle = (arc_data.startAngle + arc_data.endAngle) / 2;

        var arc_element = chart.g().select('.' + getSliceClassByKey(arc_data.data.key));

        var text_element_client = arc_element.select('text').node().getBoundingClientRect();
        var text_element_width  = text_element_client.width;
        var text_element_left   = text_element_client.left;
        var text_element_right  = text_element_client.right;

        var svg_element_client = chart.svg().node().getBoundingClientRect();
        var svg_element_left   = svg_element_client.left;
        var svg_element_right  = svg_element_client.right;

        var path_width  = arc_element.select('path').node().getBoundingClientRect().width;
        var path_height = arc_element.select('path').node().getBoundingClientRect().height;

        if (path_width < text_element_width || path_height < text_element_width) {
            arc_data.displayed = false;
            arc_element.select('text').classed(getSliceTextUndisplayedClass(), true);
        } else {
            arc_data.displayed = true;
        }

        if (angle > Math.PI) {
            if (text_element_left < svg_element_left && arc_data.displayed) {
                arc_data.displayed = false;
                arc_element.select('text').classed(getSliceTextUndisplayedClass(), true);
            } else if (arc_data.displayed) {
                arc_data.displayed = true;
                arc_element.select('text').classed(getSliceTextUndisplayedClass(), false);
            }
        } else {
            if (text_element_right > svg_element_right && arc_data.displayed) {
                arc_data.displayed = false;
                arc_element.select('text').classed(getSliceTextUndisplayedClass(), true);
            } else if (arc_data.displayed) {
                arc_data.displayed = true;
                arc_element.select('text').classed(getSliceTextUndisplayedClass(), false);
            }
        }
    }

    function replaceText(arc_data) {
        var arc_element = chart.g().select('.' + getSliceClassByKey(arc_data.data.key));
        var angle       = (arc_data.startAngle + arc_data.endAngle) / 2;

        var text_element_client = arc_element.select('text').node().getBoundingClientRect();
        var text_element_left   = text_element_client.left;
        var text_element_right  = text_element_client.right;

        var svg_element_client = chart.svg().node().getBoundingClientRect();
        var svg_element_left   = svg_element_client.left;
        var svg_element_right  = svg_element_client.right;

        if (angle > Math.PI) {
            if (text_element_left < svg_element_left) {
                arc_element.select('text').style('text-anchor', 'start');
            }
        } else {
            if (text_element_right > svg_element_right) {
                arc_element.select('text').style('text-anchor', 'end');
            }
        }
    }

    function onSliceAndTextOver(key) {
        chart.g().select('.' + getSliceClassByKey(key) + ' path')
            .transition()
            .attr('d', chart.arcOver())
            .attr('transform', function (d) {
                if (sliceEqualsTo180Degrees(d)) {
                    var angle = d.startAngle + d.endAngle / 2;

                    if (angle > Math.PI) {
                        return 'translate(-2,2)';
                    } else {
                        return 'translate(2,2)';
                    }
                }
            });

        chart.g().select('.' + getSliceClassByKey(key) + ' text')
            .classed(getSliceTextUndisplayedClass(), false)
            .transition()
            .attr('transform', function(d) {
                return 'translate(' + chart.arcOverText().centroid(d) + ')';
            });

        d3.select('.' + getLegendClassByKey(key)).classed(getLegendSelectedClass(), true);
    }

    function onSliceAndTextOut(key) {
        chart.g().select('.' + getSliceClassByKey(key) + ' path')
            .transition()
            .attr('d', chart.arc())
            .attr('transform', function (d) {
                if (sliceEqualsTo180Degrees(d)) {
                    return 'translate(0,0)';
                }
            });

        chart.g().select('.' + getSliceClassByKey(key) + ' text')
            .classed(getSliceTextUndisplayedClass(), function(d) {
                if (! d.displayed) {
                    return true;
                }
            })
            .transition()
            .attr('transform', function(d) {
                return 'translate(' + chart.arcText().centroid(d) + ')';
            });

        d3.select('.' + getLegendClassByKey(key)).classed(getLegendSelectedClass(), false);
    }

    function padAngle(slice_data) {
        if (sliceEqualsTo180Degrees(slice_data)) {
            return 0;
        } else {
            return 0.05;
        }
    }

    function sliceEqualsTo180Degrees(slice_data) {
        return (slice_data.startAngle === 0 && parseInt(slice_data.endAngle) === parseInt(Math.PI, 10))
            || (parseInt(slice_data.startAngle, 10) === parseInt(Math.PI, 10)
                && parseInt(slice_data.endAngle, 10) === parseInt(2 * Math.PI, 10));
    }

    return chart;
};