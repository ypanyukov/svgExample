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
        event = event  || window.event;
        
        if (event.clientX)
            return {x: event.clientX - element.getBoundingClientRect().left, y: event.clientY - element.getBoundingClientRect().top}            
        else
            return false;
    }
}

SVGTools = { //SVGTools - a helper object for creating SVG's object
    svgNS: 'http://www.w3.org/2000/svg', //uses namespace
    
    drawElement: function(selector, params){ //main method SBGTools's object
        element = document.createElementNS(this.svgNS, selector);
        for (p in params){
            val = params[p];
            element.setAttribute(p, val);
        }
        return element;        
    },
    
    drawLine: function(x0, y0, x1, y1, strokeWidth, strokeColor, className){
        className = !className ? "" : className;
        d = "M " + x0 + " " + y0 + " L " + x1 + " " + y1;
        params = {
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
        params = {
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
        preventData = data, //temp variable
        dataMin,
        dataMax,
        defaultRandomDataCount = 20,
        //configs
        xStep = 40,
        circleRadius = 5,
        defaultCircleColor = "#419CEB",
        defaultLineColor = "#000",
        whiteColor = "rgba(255, 255, 255, 1)",
        miminSVGWidth = 1000,
        minSVGsHeight = 400,
        axisLineY = 8,
        axisLineY = 12,
        //configs
        //tooltip config
        tooltipSize = {width:100, height:30},
        textintTooltioPosition = {x: 10, y :20},
        tooltipContent,
        tooltipBackground = "rgba(255, 255, 255, 0.85)",
        //tooltip config
        points = [],
        dataGrid,
        defaultAnimateAction = 100,
        texts = [];
    
    init = function(){ //init function create  svg node object
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
        if (typeof preventData != "object")
            data = this.getRandomData(defaultRandomDataCount);
        
        dataMin = Math.min.apply(Math, data); //a simple solution data[0] if u use data.sort() variable
        dataMax = Math.max.apply(Math, data); //a simple solution data[data.length - 1] if u use data.sort() variable
                
        config = (!config) ? { height:minSVGsHeight, width:miminSVGWidth } : config;
        config.height = (!config.height || config.height < minSVGsHeight) ? minSVGsHeight : config.height;
        config.width = (!config.width || config.width < miminSVGWidth) ? miminSVGWidth : config.width;
        config.width = data.length * xStep > config.width - 150 ? data.length * xStep + 150 : config.width;
        this.config = config;
        
        intersectionOfAxes = {x: 50, y: config.height - 50};
        pointShape = {minX: 50, maxX: config.width - 50, minY: config.height - 50, maxY: 50};        
        
        xStep = parseInt((pointShape.maxX - pointShape.minX) / data.length) < 40 ? 40 : parseInt((pointShape.maxX - pointShape.minX) / data.length);        
        yStep = (pointShape.minY - pointShape.maxY) / (dataMax - dataMin);
        
        if (!svg)
            init();
            
        drawArea();
        drawAxis();
        drawGrid();
        drawData();
        drawTooltip();
    }
    
    drawGrid = function(){
        
    }    
    
    drawArea = function(){
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
    
    drawAxis = function(){
        lineY = SVGTools.drawLine(intersectionOfAxes.x, intersectionOfAxes.y + 25, intersectionOfAxes.x, 50, 1, defaultLineColor, "axis");
        lineX = SVGTools.drawLine(intersectionOfAxes.x - 25, intersectionOfAxes.y, config.width - 50, intersectionOfAxes.y, 1, defaultLineColor, "axis");
        svg.appendChild(lineY);
        svg.appendChild(lineX);
        
        params = { transform: "translate(0, 0)" };
        dataGrid = SVGTools.drawElement("g", params);
        svg.appendChild(dataGrid);
    }
    
    drawTooltip = function(){
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
    
    drawData = function(){
        
        for (d in data){
            item = data[d];
            y = pointShape.minY - (item - dataMin) * yStep;
            x = d * xStep + pointShape.minX;
            var point = SVGTools.drawCircle(x, y, circleRadius, defaultCircleColor, defaultCircleColor, "point");            
            points.push(point);
            texts.push({item: item, d: d});
            dataGrid.appendChild(point);
        }
        
        points.forEach(pointEvent);
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
    
    this.newData = function(x){
        data.push(x);
        d = data.length - 1;
        
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
    
    this.getRandomData = function(count){
        count = (!count) ? 10 : count;
        data = [];
        
        for (var i = 0; i < count; i++){
            rX = parseInt(Math.random() * 10000);
            data.push(rX);
        }
        
        return data
    }
    
    this.draw();
    
    this.chart = 0.1;
}