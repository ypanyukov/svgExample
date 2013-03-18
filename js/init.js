Tools.ready(function(){
    
    data = {};
    data.y = [2,6,0,5,8,2,10,1];
    data.x = ["Moscow", "Tula", "Nicosia", "Limassol", "Bangkok", "Kiev", "Kishinev", "Tokio", "Sidney"];
    
    chart = new Chart("#chart", data, "circle", {height:500, width:500}); //create Chart object
    randomChart = new Chart("#randomChart", "random", "square", {height:500, width:500}); //create Chart object
    randomChartAdd = new Chart("#randomChartAdd", {t: "random", c: 30}, "circle", {height:500, width:500}); //create Chart object
   
   /*interval = setInterval(function(){
       newX = parseInt(Math.random() * 10000); 
       randomChartAdd.newData(newX); //add to Chart object new data, reload time = 2sec
   }, 2000);*/
});