Tools = { //small class for work with events
    addEvent: function(element, type, callback){
        if (element.attachEvent)
            element.attachEvent('on' + type, callback);
        else
            element.addEventListener(type, callback);
    },
    
    ready: function(callback){ //$(document).ready
        if (document.attachEvent){
            document.attachEvent('DOMContentLoaded', callback);
            document.attachEvent('onready', callback);
        }
        else{
            document.addEventListener('DOMContentLoaded', callback);
            document.addEventListener('ready', callback);
        }
    },
    
    getMousePoint: function(element, event){ //mouse point on the element
        var event = event  || window.event;
        
        if (event.clientX)
            return {x: event.clientX - element.getBoundingClientRect().left, y: event.clientY - element.getBoundingClientRect().top}            
        else
            return false;
    }
}

SVGTools = { //SVGTools - a helper object for creating SVG's object
    svgNS: 'http://www.w3.org/2000/svg', //uses namespace
    
    drawElement: function(selector, params){ //main method SBGTools's object
        var element = document.createElementNS(this.svgNS, selector),
            val;
        
        for (var p in params){
            val = params[p];
            element.setAttribute(p, val);
        }
        return element;        
    },
    
    drawLine: function(x0, y0, x1, y1, strokeWidth, strokeColor, className){
        var className = !className ? "" : className,
            d = "M " + x0 + " " + y0 + " L " + x1 + " " + y1;
        var params = {
            fill: "none",
            d: d,
            stroke: strokeColor,
            "stroke-width": strokeWidth,
            "class": className,
        }
        return this.drawElement("path", params);
    },
    
    drawCircle: function(x, y, r, stroke, fill, className){
        className = !className ? "" : className;
        var params = {
            cx: x,
            cy: y,
            r: r,
            stroke: stroke,
            "class": className,
            fill: fill
        }
        return this.drawElement("circle", params);
    }
}



Chart = function(selector, data, type, config){
    var svg, // svg node
        parentElement,
        dataX = [],
        dataY = [],
        preventData = data, //temp variable
        dataMin,
        dataMax,
        defaultRandomDataCount = 20,
        params = {},
        //configs
        xStep = 40,
        yStep,
        circleRadius = 5,
        defaultCircleColor = "#419CEB",
        defaultLineColor = "#000",
        whiteColor = "rgba(255, 255, 255, 1)",
        miminSVGWidth = 1000,
        minSVGsHeight = 400,
        axisLineY = 8,
        axisLineX = 12,
        at,
        area,
        grid,
        //configs
        //tooltip config
        tooltip,
        tooltipSize = {width:120, height:30},
        textintTooltioPosition = {x: 10, y :20},
        tooltipContent,
        tooltipBackground = "rgba(255, 255, 255, 0.85)",
        //tooltip config
        points = [],
        dataGrid,
        defaultAnimateAction = 100,
        texts = [];
    
    init = function(){ //init function create  svg node object
        console.log("Start");
        
        if (!document.querySelector) //https://developer.mozilla.org/ru/docs/DOM/Document.querySelector only msie version < 8 will suffer 
            return false;
        
        parentElement = document.querySelector(selector); //only :first-child element
        if(!parentElement)
            return false;
        
        params = {
            "xmlns:svg": "http://www.w3.org/2000/svg",
            width: config.width + "px",
            height: config.height + "px",
            "class": "chart"
        };
        svg = SVGTools.drawElement("svg", params);
                
        parentElement.appendChild(svg);
    }
    
    this.draw = function(){
        if (typeof preventData != "object" || preventData.t == "random"){
            defaultRandomDataCount = !preventData.c ? defaultRandomDataCount : preventData.c;
            data = this.getRandomData(defaultRandomDataCount);
        }
        
        dataY = data.y ? data.y : data;
        if (!data.x){
            for(var r = 0; r < dataY.length; r++)
                dataX.push(r);
        }
        else
            dataX = data.x;
        
        dataMin = Math.min.apply(Math, dataY); //a simple solution dataY[0] if u use dataY.sort() variable
        dataMax = Math.max.apply(Math, dataY); //a simple solution dataY[dataY.length - 1] if u use dataY.sort() variable
                
        config = (!config) ? { height:minSVGsHeight, width:miminSVGWidth } : config;
        config.height = (!config.height || config.height < minSVGsHeight) ? minSVGsHeight : config.height;
        config.width = (!config.width || config.width < miminSVGWidth) ? miminSVGWidth : config.width;
        config.width = dataY.length * xStep > config.width - 150 ? dataY.length * xStep + 150 : config.width;
        this.config = config;
        
        intersectionOfAxes = {x: 50, y: config.height - 50};
        pointShape = {minX: 50, maxX: config.width - 50, minY: config.height - 50, maxY: 50};        
        
        xStep = parseInt((pointShape.maxX - pointShape.minX) / dataY.length) < 40 ? 40 : parseInt((pointShape.maxX - pointShape.minX) / dataY.length);        
        yStep = (pointShape.minY - pointShape.maxY) / (dataMax - dataMin);
        
        if (!svg)
            init();
            
        this.drawArea();
        this.drawAxis();
        this.drawGrid();
        this.drawData();
        this.drawTooltip();
    }
    
    this.drawGrid = function(){
        var line,
            text;
            
        params = { transform: "translate(0, 0)" };
        grid = SVGTools.drawElement("g", params);
        svg.appendChild(grid);
        
        axisLineX = dataY.length > 10 ? dataY.length < 20 ? dataY.length : parseInt(dataY.length / 2) : axisLineX;
        
        stepForAxis = {}
        stepForAxis.Y = (pointShape.minY - pointShape.maxY) / axisLineY;
        stepForAxis.X = (pointShape.maxX - pointShape.minX) / axisLineX;
        
        stepTextY = parseFloat((dataMax - dataMin) / axisLineY);
        
        for (var f = 0; f <= axisLineY; f++){
            params = {
                x: intersectionOfAxes.x - 30,
                y: intersectionOfAxes.y + 10 - f * stepForAxis.Y,
                "class": "axisText",
                zIndex:1
                
            };
            text = SVGTools.drawElement("text", params);
            grid.appendChild(text);
            
            params = { };
            at = SVGTools.drawElement("tspan", params);
            at.textContent = dataMin + f * stepTextY;
            text.appendChild(at);
            
            line = SVGTools.drawLine(intersectionOfAxes.x - 10, intersectionOfAxes.y - f * stepForAxis.Y, config.width - 50, intersectionOfAxes.y - f * stepForAxis.Y, 0.1, defaultLineColor, "grid");
            grid.appendChild(line);
        }
        
        for (var f = 0; f <= axisLineX; f++){            
            line = SVGTools.drawLine(intersectionOfAxes.x + f * stepForAxis.X, intersectionOfAxes.y + 10, intersectionOfAxes.x + f * stepForAxis.X, 50, 0.1, defaultLineColor, "grid");
            grid.appendChild(line);
        }
        
    }    
    
    this.drawArea = function(){
        params = {
            rx: 5,
            ry: 5,
            fill: whiteColor,
            x: 0,
            y: 0,
            width: config.width,
            height: config.height            
        }
        area = SVGTools.drawElement("rect", params);
        svg.appendChild(area);
    }
    
    this.drawAxis = function(){
        var lineX,
            lineY;
        
        lineY = SVGTools.drawLine(intersectionOfAxes.x, intersectionOfAxes.y + 25, intersectionOfAxes.x, 50, 1, defaultLineColor, "axis y");
        lineX = SVGTools.drawLine(intersectionOfAxes.x - 25, intersectionOfAxes.y, config.width - 50, intersectionOfAxes.y, 1, defaultLineColor, "axis x");
        svg.appendChild(lineY);
        svg.appendChild(lineX);
    }
    
    this.drawTooltip = function(){
        var text,
            tooltipRect;
        
        params = {
            visibility: "hidden",
        }
        tooltip = SVGTools.drawElement("g", params);
        svg.appendChild(tooltip);
        
        params = {
            rx: 5,
            ry: 5,
            stroke: defaultCircleColor,
            "stroke-width": 3,
            fill: tooltipBackground,
            x: 0,
            y: 0,
            width: tooltipSize.width,
            height: tooltipSize.height            
        }
        tooltipRect = SVGTools.drawElement("rect", params);
        tooltip.appendChild(tooltipRect);
        
        params = {
            x: textintTooltioPosition.x,
            y: textintTooltioPosition.y,
            "class": "tooltipText",
            zIndex:1
            
        };
        text = SVGTools.drawElement("text", params);
        tooltip.appendChild(text);
        
        params = { };
        tooltipContent = SVGTools.drawElement("tspan", params);
        text.appendChild(tooltipContent);
    }
    
    this.drawData = function(){
        var x, y;
        
        params = { transform: "translate(0, 0)" };
        dataGrid = SVGTools.drawElement("g", params);
        svg.appendChild(dataGrid);
        
        for (var d in dataY){
            var item = dataY[d];
            y = pointShape.minY - (item - dataMin) * yStep;
            x = d * xStep + pointShape.minX;
            var point = SVGTools.drawCircle(x, y, circleRadius, defaultCircleColor, defaultCircleColor, "point");            
            points.push(point);
            texts.push({item: item, d: dataX[d]});
            dataGrid.appendChild(point);
        }
        
        points.forEach(pointEvent);
    }
    
    this.newData = function(x){
        dataY.push(x);
        var d = dataY.length - 1;
        
        item = x;
        y = pointShape.minY - (item - dataMin) * yStep;
        x = d * xStep + pointShape.minX;
        var point = SVGTools.drawCircle(x, y, circleRadius, defaultCircleColor, defaultCircleColor, "point");
        points.push(point);
        texts.push({item: item, d: d});
        dataGrid.appendChild(point);
        
        var c = 0;
        var inter = setInterval(function(){
            if (c == 0){
                removeElement = points.shift();
                removeElement.parentNode.removeChild(removeElement);
                texts.shift();                
                points.forEach(pointEvent);
            }
            oldX = dataGrid.transform.baseVal.getItem(0).matrix.e;
            newTransformX = oldX - xStep / defaultAnimateAction;
            dataGrid.transform.baseVal.getItem(0).setTranslate(newTransformX, 0);
            if (++c == defaultAnimateAction){
                clearInterval(inter);
                return false;
            }
        }, 10);
    }
        
    pointEvent = function(element, index, array) {
        Tools.addEvent(element, "mousemove", function(e){
            pos = Tools.getMousePoint(svg, e);
            tooltip.setAttribute("visibility", "visible");
            tooltip.setAttribute("transform", "translate(" + (pos.x + 10) + "," + (pos.y - tooltipSize.height) + ")");
            tooltipContent.textContent = "x: " + texts[index].item + " y: " + texts[index].d;
        });
        
        Tools.addEvent(element, "mouseout", function(e){
            tooltip.setAttribute("visibility", "hidden");
            tooltipContent.textContent = "";
        });
    }
    
    this.getRandomData = function(count){
        var rX;
        
        count = (!count) ? 10 : count;
        data = [];
        
        for (var i = 0; i < count; i++){
            rX = parseInt(Math.random() * 10000);
            data.push(rX);
        }
        
        return {y:data};
    }
    
    this.draw();
    
    this.chart = 0.1;
}