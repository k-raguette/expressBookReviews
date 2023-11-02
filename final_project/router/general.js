const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const doesExist = (username)=>{
    let userswithsamename = users.filter((user)=>{
      return user.username === username
    });
    if(userswithsamename.length > 0){
      return true;
    } else {
      return false;
    }
  }
  
const authenticatedUser = (username,password)=>{
    let validusers = users.filter((user)=>{
      return (user.username === username && user.password === password)
    });
    if(validusers.length > 0){
      return true;
    } else {
      return false;
    }
  }
const public_users = express.Router();
const session = require('express-session')
const jwt = require('jsonwebtoken')

public_users.use(session({secret: 'fingerpint'}, (resave = true), (saveUninitialized = true)));

public_users.post("/register", (req,res) => {
  //Write your code here
  const username = req.body.username
  const password = req.body.password

  if (username && password) {
      if (!isValid(username)) {
          users.push({username: username, password: password})
          return res.status(200).json({
              message: 'User successfully registered. Now you can login',
          })
      } else {
          return res.status(404).json({message: 'User already exists!'})
      }
  }
  return res.status(404).json({message: 'Unable to register user.'})
});

// Get the book list available in the shop
public_users.get('/', async (req, res) => {
    try {
      const books = await getBooks();
      res.status(200).json({ books });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  });
  
  async function getBooks() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (books) {
          resolve(books);
        } else {
          reject("No books found.");
        }
      }, 6000);
    });
  }

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
    try {
      const isbn = req.params.isbn;
      const book = await getBookDetails(isbn);
  
      if (book) {
        res.status(200).json(book);
      } else {
        res.status(404).json({ message: 'Book not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  async function getBookDetails(isbn) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (books[isbn]) {
          resolve(books[isbn]);
        } else {
          reject('Book not found');
        }
      }, 6000);
    });
  }
  
// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
    try {
      const author = req.params.author;
      const matchingBooks = await getBooksByAuthor(author);
  
      if (matchingBooks.length > 0) {
        res.status(200).json(matchingBooks);
      } else {
        res.status(404).json({ message: 'Books by the author not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  async function getBooksByAuthor(author) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const matchingBooks = Object.values(books).filter(book => book.author === author);
  
        if (matchingBooks.length > 0) {
          resolve(matchingBooks);
        } else {
          reject('Books by the author not found');
        }
      }, 6000);
    });
  }

// Get all books based on title
public_users.get('/title/:title', async (req, res) => {
    try {
      const title = req.params.title;
      const matchingBooks = await getBooksByTitle(title);
  
      if (matchingBooks.length > 0) {
        res.status(200).json(matchingBooks);
      } else {
        res.status(404).json({ message: 'Books with the title not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  async function getBooksByTitle(title) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const matchingBooks = Object.values(books).filter(book => book.title === title);
  
        if (matchingBooks.length > 0) {
          resolve(matchingBooks);
        } else {
          reject('Books with the title not found');
        }
      }, 6000);
    });
  }

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;

  // Check if the ISBN exists in the books object
  if (books[isbn]) {
    const bookReviews = books[isbn].reviews || [];

    if (bookReviews.length > 0) {
      // If reviews are found for the book, send them as a JSON response
      res.status(200).json({ reviews: bookReviews });
    } else {
      // If no reviews are found, send a message indicating that there are no reviews
      res.status(200).json({});
    }
  } else {
    // If the book with the given ISBN is not found, send a not found response
    res.status(404).json({ message: 'Book not found' });
  }
});

public_users.post('/login', (req, res) => {
	const username = req.body.username
	const password = req.body.password

	if (!username || !password) {
		return res.status(404).json({message: 'Error logging in'})
	}

	if (authenticatedUser(username, password)) {
		let accessToken = jwt.sign(
			{
				data: password,
			},
			'access',
			{expiresIn: 60 * 60}
		)

		req.session.authorization = {
			accessToken,
			username,
		}
		return res.status(200).send('User successfully logged in')
	} else {
		return res
			.status(208)
			.json({message: 'Invalid Login. Check username and password'})
	}
});

public_users.put('/auth/review/:isbn', (req, res) => {
	const isbn = req.params.isbn
	const review = req.body.review
	const username = req.session.authorization.username
	if (books[isbn]) {
		let book = books[isbn]
		book.reviews[username] = review
		return res.status(200).send(`The review for the book with ISBN ${isbn} has been added/updated`)
	} else {
		return res.status(404).json({message: `ISBN ${isbn} not found`})
	}
});

public_users.delete('/auth/review/:isbn', (req, res) => {
	const isbn = req.params.isbn
	const username = req.session.authorization.username
	if (books[isbn]) {
		let book = books[isbn]
		delete book.reviews[username]
		return res.status(200).send(`Reviews for the ISBN ${isbn} posted by the user ${username} deleted`)
	} else {
		return res.status(404).json({message: `ISBN ${isbn} not found`})
	}
});

module.exports.general = public_users;
