Tools.ready(function(){
    console.log("Start!");
   
    chart = new Chart("#chart", "random", "circle", {height:500, width:500}); //create Chart object
   
    interval = setInterval(function(){
       newX = parseInt(Math.random() * 10000); 
       chart.newData(newX); //add to Chart object new data, reload time = 2sec
   }, 2000);
});