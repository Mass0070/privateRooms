module.exports = {
    requiredAuthenticated: (req, res, next) => {
      
      if (req.headers.root === "") {
        return next();
      }
      res.json({error: "Not authorized."});         
    }
  };