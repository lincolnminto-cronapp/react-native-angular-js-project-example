const getPage = (path) => {
  const promise = new Promise((resolve, reject) => {
    fetch(path)
      .then(async (result) => {
        resolve(await result.text());
      })
      .catch((error) => {
        reject(error);
      });
  });
  return promise;
};

module.exports = {getPage};
