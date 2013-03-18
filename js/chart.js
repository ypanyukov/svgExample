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
            d = "M " + x0 + " " + y0 + " L " + x1 + " " + y1,
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
        var className = !className ? "" : className,
            params = {
            cx: x,
            cy: y,
            r: r,
            stroke: stroke,
            "class": className,
            fill: fill
        }
        return this.drawElement("circle", params);
    },
    
    drawSquare: function(x, y, w, stroke, fill, className){
        var className = !className ? "" : className,
            d = "M " + (x - w/2) + " " + (y - w/2) + " L " + (x + w/2) + " " + (y - w/2) + " " + (x + w/2) + " " + (y + w/2) + " " + (x - w/2) + " " + (y + w/2) + " Z",
            params = {
                d: d,
                stroke: stroke,
                "class": className,
                fill: fill
            }
            
        return this.drawElement("path", params);
    }
}

Chart = function(selector, data, type, config){
    var svg, // svg node
        _data = {x:[], y:[], min:0, max:0},
        defaultRandomDataCount = 20,
        params = {},
        //configs
        config,
        steps = { x: 40, y: 0},
        circleRadius = 5,
        squareWidth = 10,
        defaultCircleColor = "#419CEB",
        defaultLineColor = "#000",
        whiteColor = "rgba(255, 255, 255, 1)",
        miminSVGWidth = 1000,
        minSVGsHeight = 400,
        axisLine = {x:12, y:8},
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
    
    this.init = function(){ //init function create  svg node object
        var parentElement;
        
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

        console.log("Start. Draw in " + parentElement.id); 
    }
    
    this.draw = function(){
        var preventData = data; //temp variable
        if (typeof preventData != "object" || preventData.t == "random"){ //if data == "random" or special object with t:"random"
            defaultRandomDataCount = !preventData.c ? defaultRandomDataCount : preventData.c;
            _data = this.getRandomData(defaultRandomDataCount);
        }
        
        _data.y = data.y ? data.y : data;
        if (data.x.length == 0){
            for(var r = 0; r < _data.y.length; r++)
                _data.x.push(r);
        }
        else
            _data.x = data.x;
        
        _data.min = Math.min.apply(Math, _data.y); //a simple solution _data.y[0] if u use _data.y.sort() variable
        _data.max = Math.max.apply(Math, _data.y); //a simple solution _data.y[_data.y.length - 1] if u use _data.y.sort() variable
        
        config = (!config) ? { height:minSVGsHeight, width:miminSVGWidth } : config;
        config.height = (!config.height || config.height < minSVGsHeight) ? minSVGsHeight : config.height;
        config.width = (!config.width || config.width < miminSVGWidth) ? miminSVGWidth : config.width;
        
        intersectionOfAxes = {x: 50, y: config.height - 50}; //0, 0
        pointShape = {minX: 50, maxX: config.width - 50, minY: config.height - 50, maxY: 50}; //when i draw
        
        steps.x = parseInt((pointShape.maxX - pointShape.minX) / _data.y.length) < steps.x ? steps.x : parseInt((pointShape.maxX - pointShape.minX) / _data.y.length);        
        steps.y = (pointShape.minY - pointShape.maxY) / (_data.max - _data.min);        
        
        config.width = _data.y.length * steps.x > config.width - 150 ? _data.y.length * steps.x + 150 : config.width;
        config.type = type;
        this.config = config; //if it is need for read in View
        
        if (!svg)
            this.init();
            
        this.drawArea();
        this.drawAxis();
        this.drawGrid();
        this.drawData();
        this.drawTooltip();

        console.log("Finish");
    }
    
    this.drawGrid = function(){ //draw grid in pointShape and labels
        var line,
            text,
            at,
            grid,
            stepForAxis,
            stepTextY;
            
        params = { transform: "translate(0, 0)" };
        grid = SVGTools.drawElement("g", params);
        svg.appendChild(grid);
        
        axisLine.x = _data.y.length > 10 ? _data.y.length < 20 ? _data.y.length : parseInt(_data.y.length / 2) : axisLine.x;
        
        stepForAxis = {}
        stepForAxis.Y = (pointShape.minY - pointShape.maxY) / axisLine.y;
        stepForAxis.X = (pointShape.maxX - pointShape.minX) / axisLine.x;
        
        stepTextY = parseFloat((_data.max - _data.min) / axisLine.y);
        
        for (var f = 0; f <= axisLine.y; f++){
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
            at.textContent = _data.min + f * stepTextY;
            text.appendChild(at);
            
            line = SVGTools.drawLine(intersectionOfAxes.x - 10, intersectionOfAxes.y - f * stepForAxis.Y, config.width - 50, intersectionOfAxes.y - f * stepForAxis.Y, 0.2, defaultLineColor, "grid");
            grid.appendChild(line);
        }
        
        for (var f = 0; f <= axisLine.x; f++){            
            line = SVGTools.drawLine(intersectionOfAxes.x + f * stepForAxis.X, intersectionOfAxes.y + 10, intersectionOfAxes.x + f * stepForAxis.X, 50, 0.2, defaultLineColor, "grid");
            grid.appendChild(line);
        }
        
    }    
    
    this.drawArea = function(){ //draw "whiteColor" area for drawall objects
        var area;

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
    
    this.drawAxis = function(){ //draw axis
        var lineX,
            lineY;
        
        lineY = SVGTools.drawLine(intersectionOfAxes.x, intersectionOfAxes.y + 25, intersectionOfAxes.x, 50, 1, defaultLineColor, "axis y");
        lineX = SVGTools.drawLine(intersectionOfAxes.x - 25, intersectionOfAxes.y, config.width - 50, intersectionOfAxes.y, 1, defaultLineColor, "axis x");
        svg.appendChild(lineY);
        svg.appendChild(lineX);
    }
    
    this.drawTooltip = function(){ //draw tooltip
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
    
    this.drawData = function(){ //draw points
        var x, y, point;
        
        params = { transform: "translate(0, 0)" };
        dataGrid = SVGTools.drawElement("g", params);
        svg.appendChild(dataGrid);
        
        for (var d in _data.y){
            var item = _data.y[d];
            y = pointShape.minY - (item - _data.min) * steps.y;
            x = d * steps.x + pointShape.minX;
            
            if (config.type == "square")
                point = SVGTools.drawSquare(x, y, squareWidth, defaultCircleColor, defaultCircleColor, "point square");             
            else
                point = SVGTools.drawCircle(x, y, circleRadius, defaultCircleColor, defaultCircleColor, "point circle");
            
            points.push(point);
            texts.push({item: item, d: _data.x[d]});
            dataGrid.appendChild(point);
        }
        
        points.forEach(pointEvent);
    }
    
    this.newData = function(x){ 
        var point;
        
        _data.y.push(x);
        var d = _data.y.length - 1;
        
        item = x;
        y = pointShape.minY - (item - _data.min) * steps.y;
        x = d * steps.x + pointShape.minX;        
            
        if (config.type == "square")
            point = SVGTools.drawSquare(x, y, squareWidth, defaultCircleColor, defaultCircleColor, "point square");            
        else
            point = SVGTools.drawCircle(x, y, circleRadius, defaultCircleColor, defaultCircleColor, "point circle");
            
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
            newTransformX = oldX - steps.x / defaultAnimateAction;
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
        data = _data;
        
        for (var i = 0; i < count; i++){
            rX = parseInt(Math.random() * 10000);
            data.y.push(rX);
        }
        
        return data;
    }
    
    this.draw();
    
    this.chart = 0.1;
}