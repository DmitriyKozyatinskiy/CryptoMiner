export const checkRequestStatus = (response) => {
  if (response.ok) {
    return response.json();
  } else {
    const error = new Error(response.statusText);
    return response.json().then(data => {
      error.response = data;
      throw error;
    });
  }
};
