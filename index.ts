const responseA = await fetch("https://petstore.swagger.io/v2/pet/findByStatus", {
  method: "GET",
  headers: {
    "accept": "application/json"
  }
});
console.log("A (no status):", responseA.status);


const responseB = await fetch("https://petstore.swagger.io/v2/pet/findByStatus?status=notarealstatus123", {
  method: "GET",
  headers: {
    "accept": "application/json"
  }
});
console.log("B (invalid status):", responseB.status);


const responseControl = await fetch("https://petstore.swagger.io/v2/pet/findByStatus?status=available", {
  method: "GET",
  headers: {
    "accept": "application/json"
  }
});
console.log("Control (valid status):", responseControl.status);
