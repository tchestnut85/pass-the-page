const router = require('express').Router();
const { Author, Story, Chapter } = require('../models');
const userAuth = require('../utils/userAuth');
const analyzeText = require('../utils/natural');

// Render the dashboard of the current logged in user and display their info
router.get('/', userAuth, (req, res) => {
    console.log('========= Dashboard Rendered =========');

    Author.findOne({
        where: {
            username: req.session.username
        }
    })
        .then(authorData => {
            if (authorData) {
                const author = authorData.get({ plain: true });

                Story.findAll({
                    where: {
                        author_id: req.session.author_id
                    },
                    order: [['created_at', 'DESC']],
                    include: [
                        {
                            model: Author,
                            attributes: ['id', 'username', 'title', 'bio', 'email']
                        },
                        {
                            model: Chapter,
                            attributes: ['chapter_text'],
                            include: [
                                {
                                    model: Author,
                                    attributes: ['username']
                                }
                            ]
                        }
                    ]
                })
                    .then(storyData => {
                        const stories = storyData.map(story => story.get({ plain: true }));
                        analyzeText(stories)
                            .then(analyzedData => {
                                res.render('dashboard', {
                                    author,
                                    stories: analyzedData,
                                    loggedIn: req.session.loggedIn
                                });
                            });
                    });
            } else {
                res.status(404).json({ message: "We couldn't find your info." });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

// Render a page for the user to update their info
router.get('/edit-user/:id', userAuth, (req, res) => {
    Author.findOne({
        where: {
            id: req.session.author_id
        },
        attributes: ['username', 'email', 'title', 'bio']
    })
        .then(authorData => {
            if (authorData) {
                const author = authorData.get({ plain: true });
                res.render('edit-user', { author, loggedIn: req.session.loggedIn });
            } else {
                res.status(404).json({ message: "We couldn't find your info." });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

// Route to create a new story
router.get('/new-story', (req, res) => {
    res.render('new-story', { loggedIn: req.session.loggedIn });
});

// Route to render a page to edit an existing story
router.get('/edit-story/:id', (req, res) => {
    Story.findOne({
        where: {
            id: req.params.id
        }
    })
        .then(storyData => {
            if (storyData) {
                console.log(storyData);
                const story = storyData.get({ plain: true });
                res.render('edit-story', { story, loggedIn: req.session.loggedIn });
            } else {
                res.status(404).json({ message: "We couldn't find that story." });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        });
});

module.exports = router;