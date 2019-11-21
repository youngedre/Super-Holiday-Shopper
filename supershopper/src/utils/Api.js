function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(`HTTP Error ${response.statusText}`);
  error.status = response.statusText;
  error.response = response;
  console.log(error);
  throw error;
}

export default { 
  search: function(query) {
    return fetch(`api/food?q=${query}`)
    .then(checkStatus)
    .then(response => response.json())
  }
};
