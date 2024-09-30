const { test, after, beforeEach } = require('node:test')
const Blog = require('../models/blog')
const mongoose = require('mongoose')
const supertest = require('supertest')
const assert = require('assert')
const app = require('../app')
const { application } = require('express')
const blog = require('../models/blog')

const api = supertest(app)

const initialBlogs = [
  {
    title: 'test blog 1',
    author: 'admin1',
    url: 'example1',
    likes: 10
  },
  {
    title: 'test blog 2',
    author: 'admin2',
    url: 'example2',
    likes: 10
  }
]

beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[1])
  await blogObject.save()
})



test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('there are two blogs', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, 2)
})

test('the first blog is blog test 1', async () => {
  const response = await api.get('/api/blogs')

  const titles = response.body.map(e => e.title)
  
  assert(titles.includes('test blog 1'))
})

test('the blogs ids are "id" and not "_id"', async () => {
  const response = await api.get('/api/blogs')

  response.body.forEach(blog => {
    assert('id' in blog, '"id" key missing')

    assert(!('_id' in blog), 'there is "_id" when there should be "id"')
  })
})

test('a new blog can be added', async() => {
  const newBlog = {
      title: 'test blog',
      author: 'admin',
      url: 'example',
      likes: 10
  }
  await api 
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  
  const response = await api.get('/api/blogs')

  const titles = response.body.map(r => r.title)

  assert.strictEqual(response.body.length, initialBlogs.length + 1)

  assert(titles.includes('test blog'))
})


test('blog without giving likes value gives likes as 0', async() => {
  const newBlog = {
    title: '0 likes test',
    author: 'admin0',
    url: 'example0'
  }
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  
  const response = await api.get('/api/blogs')

  const latestBlog = response.body[response.body.length -1]

  assert.strictEqual(latestBlog.likes, 0)
})


test('can delete a blog', async() => {
  const startBlogs = await api.get('/api/blogs')
  const blogToDelete = startBlogs.body[0]


  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)
  
  const endBlogs = await api.get('/api/blogs')
  

  assert.strictEqual(endBlogs.body.length, (initialBlogs.length - 1))

  const titles = endBlogs.body.map(r => r.title)
  assert(!titles.includes(blogToDelete.title))
})


test('can update blog', async() => {
  const startBlogs = await api.get('/api/blogs')
  const updatedId = startBlogs.body[0].id
  const updatedBlog = {
    title: 'test blog 1',
    author: 'admin1',
    url: 'example1',
    likes: 101
  }
  const response = await api
    .put(`/api/blogs/${updatedId}`)
    .send(updatedBlog)
    .expect(200)
    .expect('Content-Type', /application\/json/)
  
 
  assert.strictEqual(response.body.likes, 101)
})

after(async () => {
  await mongoose.connection.close()
})