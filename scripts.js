

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        document.getElementById('user-section').innerHTML = `
            <span>Welcome, ${capitalizeUsername(currentUser.username)}</span>
            <a href="#" id="logout-link">Logout</a>
        `;
        document.getElementById('logout-link').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            location.reload();
        });

        // Display admin link if the user is an admin
        if (currentUser.isAdmin) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.textContent = 'Admin';
            document.querySelector('nav').appendChild(adminLink);
        }
    } else {
        document.getElementById('user-section').innerHTML = `<a href="login.html">Login</a>`;
    }

    // Load lessons and quizzes
    loadLessons();

    // Load progress page if on progress.html
    if (document.getElementById('progress-table')) {
        loadProgress();
    }

    // Helper functions
    function saveCheckboxState(index, isChecked) {
        let checkboxStates = JSON.parse(localStorage.getItem('checkboxStates')) || {};
        checkboxStates[index] = isChecked;
        localStorage.setItem('checkboxStates', JSON.stringify(checkboxStates));
    }

    function loadCheckboxState(index) {
        let checkboxStates = JSON.parse(localStorage.getItem('checkboxStates')) || {};
        return checkboxStates[index] || false;
    }

    function capitalizeUsername(username) {
        return username.charAt(0).toUpperCase() + username.slice(1);
    }




//Loading Lessons onto the lesson page
function loadLessons() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    const lessonsContainer = document.getElementById('lessons-list');
    const lessonFraction = document.getElementById('lesson-fraction');
    let checkedCount = 0;

    // Combine lessons and quizzes into one array and sort by timestamp
    const combinedItems = [...lessons.map(lesson => ({ ...lesson, type: 'lesson' })), ...quizzes.map(quiz => ({ ...quiz, type: 'quiz' }))];
    combinedItems.sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp, oldest first

    if (lessonsContainer) {
        lessonsContainer.innerHTML = '';
        let index = 0;

        combinedItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add(item.type);
            itemElement.innerHTML = `
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                ${item.file ? `<a href="${item.file}" download>Download Attachment</a>` : ''}
                <p>Posted by: ${capitalizeUsername(item.username)}</p>
                <iframe src="${item.video}" frameborder="0" allowfullscreen></iframe>
                <a href="${item.type === 'lesson' ? 'lesson_detail.html' : 'quiz_detail.html'}?title=${item.title}">Go to ${item.type === 'lesson' ? 'Lesson' : 'Quiz'}</a>
                ${currentUser && currentUser.isAdmin ? `<a href="#" class="edit-${item.type}" data-index="${index}">Edit</a> <a href="#" class="delete-${item.type}" data-index="${index}">Delete</a>` : ''}
                <input type="checkbox" class="${item.type}-checkbox" style="float: right;" data-index="${index}" ${loadCheckboxState(index) ? 'checked' : ''}>
                <div class="item-type">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</div>
            `;
            lessonsContainer.appendChild(itemElement);
            index++;
        });

       // Event listener for checkboxes
            const allCheckboxes = document.querySelectorAll('.lesson-checkbox, .quiz-checkbox');
            allCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const index = checkbox.dataset.index;
                    saveCheckboxState(index, checkbox.checked);
                    updateCheckedCount();
                });
            });

            function updateCheckedCount() {
                checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
                const totalCount = allCheckboxes.length;
                lessonFraction.textContent = `${checkedCount}/${totalCount} checked`;
                updateProgressBar('lesson-progress-container', 'lesson-fraction');
            }

            updateCheckedCount();

            // Event listeners for edit and delete buttons
            document.querySelectorAll('.edit-lesson').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    const index = event.target.dataset.index;
                    editLesson(index);
                });
            });

            document.querySelectorAll('.delete-lesson').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    const index = event.target.dataset.index;
                    deleteLesson(index);
                });
            });

            document.querySelectorAll('.edit-quiz').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    const index = event.target.dataset.index;
                    editQuiz(index);
                });
            });

            document.querySelectorAll('.delete-quiz').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    const index = event.target.dataset.index;
                    deleteQuiz(index);
                });
            });
        }
    }

    function updateProgressBar(containerId, fractionId) {
        const container = document.getElementById(containerId);
        const fractionElement = document.getElementById(fractionId);
        const progressBar = container.querySelector('.progress-bar .progress');
        const totalItems = fractionElement ? parseInt(fractionElement.textContent.split('/')[1]) : 0;
        const checkedItems = fractionElement ? parseInt(fractionElement.textContent.split('/')[0]) : 0;
        const progressPercentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

        progressBar.style.width = '0%';
        setTimeout(() => {
            progressBar.style.width = `${progressPercentage}%`;
        }, 10);
    }

    function editLesson(index) {
        const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
        const lesson = lessons[index];
        const newTitle = prompt('Edit lesson title:', lesson.title);
        const newDescription = prompt('Edit lesson description:', lesson.description);

        if (newTitle !== null && newDescription !== null) {
            lesson.title = newTitle;
            lesson.description = newDescription;
            lessons[index] = lesson;
            localStorage.setItem('lessons', JSON.stringify(lessons));
            alert('Lesson updated successfully!');
            loadLessons();
        }
    }

    function deleteLesson(index) {
        const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
        lessons.splice(index, 1);
        localStorage.setItem('lessons', JSON.stringify(lessons));
        alert('Lesson deleted successfully!');
        loadLessons();
    }

    function editQuiz(title, description) {
        const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
        const quizIndex = quizzes.findIndex(q => q.title === title && q.description === description);
    
        if (quizIndex !== -1) {
            const quiz = quizzes[quizIndex];
            const newTitle = prompt('Edit quiz title:', quiz.title);
            const newDescription = prompt('Edit quiz description:', quiz.description);
    
            if (newTitle !== null && newDescription !== null) {
                quiz.title = newTitle;
                quiz.description = newDescription;
                quizzes[quizIndex] = quiz;
                localStorage.setItem('quizzes', JSON.stringify(quizzes));
                alert('Quiz updated successfully!');
                loadLessons();
            }
        } else {
            alert('Quiz not found!');
        }
    }
    
    function deleteQuiz(index) {
        // Retrieve the current list of quizzes from local storage
        const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
        
        // Ensure the provided index is within the valid range
        if (index < 0 || index >= quizzes.length) {
            alert('Invalid quiz selection.');
            return;
        }
    
        // Remove the quiz at the specified index
        quizzes.splice(index, 1);
    
        // Update the local storage with the modified list of quizzes
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
    
        // Alert the user that the quiz was deleted successfully
        alert('Quiz deleted successfully!');
    
        // Reload the lessons to reflect the changes
        loadLessons();
    }
    
    






    // function loadLessons() {
    //     const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    //     const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    //     const lessonsContainer = document.getElementById('lessons-list');
    //     const lessonFraction = document.getElementById('lesson-fraction');
    //     let checkedCount = 0;

    //     if (lessonsContainer) {
    //         lessonsContainer.innerHTML = '';
    //         let index = 0;

    //         lessons.forEach(lesson => {
    //             const lessonElement = document.createElement('div');
    //             lessonElement.classList.add('lesson');
    //             lessonElement.innerHTML = `
    //                 <h3>${lesson.title}</h3>
    //                 <p>${lesson.description}</p>
    //                 ${lesson.file ? `<a href="${lesson.file}" download>Download Attachment</a>` : ''}
    //                 <p>Posted by: ${capitalizeUsername(lesson.username)}</p>
    //                 <iframe src="${lesson.video}" frameborder="0" allowfullscreen></iframe>
    //                 <a href="lesson_detail.html?title=${lesson.title}">Go to Lesson</a>
    //                 ${currentUser && currentUser.isAdmin ? `<a href="#" class="edit-lesson" data-index="${index}">Edit</a> <a href="#" class="delete-lesson" data-index="${index}">Delete</a>` : ''}
    //                 <input type="checkbox" class="lesson-checkbox" style="float: right;" data-index="${index}" ${loadCheckboxState(index) ? 'checked' : ''}>
    //             `;
    //             lessonsContainer.appendChild(lessonElement);
    //             index++;
    //         });

    //         quizzes.forEach(quiz => {
    //             const quizElement = document.createElement('div');
    //             quizElement.classList.add('quiz');
    //             quizElement.innerHTML = `
    //                 <h3>${quiz.title}</h3>
    //                 <p>${quiz.description}</p>
    //                 ${quiz.file ? `<a href="${quiz.file}" download>Download Attachment</a>` : ''}
    //                 <p>Posted by: ${capitalizeUsername(quiz.username)}</p>
    //                 <iframe src="${quiz.video}" frameborder="0" allowfullscreen></iframe>
    //                 <a href="quiz_detail.html?title=${quiz.title}">Go to Quiz</a>
    //                 ${currentUser && currentUser.isAdmin ? `<a href="#" class="edit-quiz" data-index="${index}">Edit</a> <a href="#" class="delete-quiz" data-index="${index}">Delete</a>` : ''}
    //                 <input type="checkbox" class="quiz-checkbox" style="float: right;" data-index="${index}" ${loadCheckboxState(index) ? 'checked' : ''}>
    //             `;
    //             lessonsContainer.appendChild(quizElement);
    //             index++;
    //         });

    //         // Event listener for checkboxes
    //         const allCheckboxes = document.querySelectorAll('.lesson-checkbox, .quiz-checkbox');
    //         allCheckboxes.forEach(checkbox => {
    //             checkbox.addEventListener('change', () => {
    //                 const index = checkbox.dataset.index;
    //                 saveCheckboxState(index, checkbox.checked);
    //                 updateCheckedCount();
    //             });
    //         });

    //         function updateCheckedCount() {
    //             checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    //             const totalCount = allCheckboxes.length;
    //             lessonFraction.textContent = `${checkedCount}/${totalCount} checked`;
    //             updateProgressBar('lesson-progress-container', 'lesson-fraction');
    //         }

    //         updateCheckedCount();

    //         // Event listeners for edit and delete buttons
    //         document.querySelectorAll('.edit-lesson').forEach(button => {
    //             button.addEventListener('click', (event) => {
    //                 event.preventDefault();
    //                 const index = event.target.dataset.index;
    //                 editLesson(index);
    //             });
    //         });

    //         document.querySelectorAll('.delete-lesson').forEach(button => {
    //             button.addEventListener('click', (event) => {
    //                 event.preventDefault();
    //                 const index = event.target.dataset.index;
    //                 deleteLesson(index);
    //             });
    //         });

    //         document.querySelectorAll('.edit-quiz').forEach(button => {
    //             button.addEventListener('click', (event) => {
    //                 event.preventDefault();
    //                 const index = event.target.dataset.index;
    //                 editQuiz(index);
    //             });
    //         });

    //         document.querySelectorAll('.delete-quiz').forEach(button => {
    //             button.addEventListener('click', (event) => {
    //                 event.preventDefault();
    //                 const index = event.target.dataset.index;
    //                 deleteQuiz(index);
    //             });
    //         });
    //     }
    // }

    // function updateProgressBar(containerId, fractionId) {
    //     const container = document.getElementById(containerId);
    //     const fractionElement = document.getElementById(fractionId);
    //     const progressBar = container.querySelector('.progress-bar .progress');
    //     const totalItems = fractionElement ? parseInt(fractionElement.textContent.split('/')[1]) : 0;
    //     const checkedItems = fractionElement ? parseInt(fractionElement.textContent.split('/')[0]) : 0;
    //     const progressPercentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

    //     progressBar.style.width = '0%';
    //     setTimeout(() => {
    //         progressBar.style.width = `${progressPercentage}%`;
    //     }, 10);
    // }

    // function editLesson(index) {
    //     const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    //     const lesson = lessons[index];
    //     const newTitle = prompt('Edit lesson title:', lesson.title);
    //     const newDescription = prompt('Edit lesson description:', lesson.description);

    //     if (newTitle !== null && newDescription !== null) {
    //         lesson.title = newTitle;
    //         lesson.description = newDescription;
    //         lessons[index] = lesson;
    //         localStorage.setItem('lessons', JSON.stringify(lessons));
    //         alert('Lesson updated successfully!');
    //         loadLessons();
    //     }
    // }

    // function deleteLesson(index) {
    //     const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    //     lessons.splice(index, 1);
    //     localStorage.setItem('lessons', JSON.stringify(lessons));
    //     alert('Lesson deleted successfully!');
    //     loadLessons();
    // }

    // function editQuiz(index) {
    //     const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    //     const quiz = quizzes[index];
    //     const newTitle = prompt('Edit quiz title:', quiz.title);
    //     const newDescription = prompt('Edit quiz description:', quiz.description);

    //     if (newTitle !== null && newDescription !== null) {
    //         quiz.title = newTitle;
    //         quiz.description = newDescription;
    //         quizzes[index] = quiz;
    //         localStorage.setItem('quizzes', JSON.stringify(quizzes));
    //         alert('Quiz updated successfully!');
    //         loadLessons();
    //     }
    // }


    // function deleteQuiz(index) {
    //     // Retrieve the current list of quizzes from local storage
    //     const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
        
    //     // Remove the quiz at the specified index
    //     quizzes.splice(index, 1);
        
    //     // Update the local storage with the modified list of quizzes
    //     localStorage.setItem('quizzes', JSON.stringify(quizzes));

    //     alert('Quiz deleted successfully!');

        
    //     // Reload the lessons to reflect the changes
    //     loadLessons();
    // }
    



    function loadProgress() {
        const username = currentUser.username;
        document.getElementById('user-progress-title').textContent = `${capitalizeUsername(username)}'s Progress`;

        const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
        const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
        const progressTable = document.getElementById('progress-table');

        if (progressTable) {
            progressTable.innerHTML = `
                <div class="header">
                    <div>Type</div>
                    <div>Title</div>
                    <div>Status</div>
                </div>
            `;

            const items = lessons.concat(quizzes);

            items.forEach((item, index) => {
                const isChecked = loadCheckboxState(index);
                const statusClass = isChecked ? 'completed' : 'not-completed';
                const itemType = index < lessons.length ? 'Lesson' : 'Quiz';


                const row = document.createElement('div');
                row.classList.add(statusClass);
                row.innerHTML = `
                    <div>${itemType}</div>
                    <div>${item.title}</div>
                    <div>${isChecked ? 'Completed' : 'Not Completed'}</div>
                `;
                progressTable.appendChild(row);
            });
        }
    }




    // Login and Signup
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const storedPassword = localStorage.getItem(`password-${username}`);
            const isAdmin = localStorage.getItem(`user-${username}`) === 'admin';

            if (!storedPassword) {
                alert('User does not exist. Please sign up.');
                return;
            }

            if (storedPassword !== password) {
                alert('Incorrect password. Please try again.');
                return;
            }

            localStorage.setItem('currentUser', JSON.stringify({ username, isAdmin }));
            location.href = 'index.html';
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const isAdmin = document.getElementById('admin').checked ? 'admin' : 'user';

            localStorage.setItem(`user-${username}`, isAdmin);
            localStorage.setItem(`password-${username}`, password);
            localStorage.setItem('currentUser', JSON.stringify({ username, isAdmin: isAdmin === 'admin' }));
            location.href = 'index.html';
        });
    }




// Admin Dashboard








const postQuizForm = document.getElementById('post-quiz-form');
if (postQuizForm) {
    postQuizForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const quizTitle = document.getElementById('quiz-title').value;
        const quizDescription = document.getElementById('quiz-description').value;
        const quizFile = document.getElementById('quiz-file').files[0];
        const quizVideo = document.getElementById('quiz-video').value;
        const quizColor = document.getElementById('quiz-color').value; // Added field for quiz color
        const username = currentUser.username;

        const questions = [];
        document.querySelectorAll('.question-container').forEach((container) => {
            const questionText = container.querySelector('.question-text').value;
            const questionType = container.querySelector('.question-type').value;
            const question = { text: questionText, type: questionType, answers: [] };

            if (questionType === 'multiple-choice') {
                container.querySelectorAll('.answer').forEach((answerElem) => {
                    const answerText = answerElem.querySelector('.answer-text').value;
                    const isCorrect = answerElem.querySelector('.is-correct').checked;
                    question.answers.push({ text: answerText, correct: isCorrect });
                });
            }

            questions.push(question);
        });






        const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
        const reader = new FileReader();
        const timestamp = new Date().getTime(); // Add a timestamp for sorting

        reader.onload = function(e) {
            quizzes.push({ title: quizTitle, description: quizDescription, file: e.target.result, video: quizVideo, color: quizColor, username, timestamp, questions });
            localStorage.setItem('quizzes', JSON.stringify(quizzes));
            alert('Quiz posted successfully!');
            postQuizForm.reset();
            loadLessons();
        }
        if (quizFile) {
            reader.readAsDataURL(quizFile);
        } else {
            quizzes.push({ 
                title: quizTitle, 
                description: quizDescription, 
                file: null, 
                video: quizVideo, 
                color: quizColor, // Save quiz color
                username, 
                timestamp,
                questions 
            });
            localStorage.setItem('quizzes', JSON.stringify(quizzes));
            alert('Quiz posted successfully!');
            postQuizForm.reset();
            loadLessons();
        }
    });
}

// Function to retrieve all questions from the form
function getQuestions() {
    const questions = [];
    const questionElements = document.querySelectorAll('.question');
    
    questionElements.forEach((questionElement, index) => {
        const questionText = questionElement.querySelector('.question-text').value;
        const questionType = questionElement.querySelector('.question-type').value;
        const answers = [];

        if (questionType === 'multiple-choice') {
            const answerElements = questionElement.querySelectorAll('.answer');
            answerElements.forEach(answerElement => {
                const answerText = answerElement.querySelector('.answer-text').value;
                const isCorrect = answerElement.querySelector('.is-correct').checked;
                answers.push({ text: answerText, isCorrect: isCorrect });
            });
        }

        questions.push({ 
            text: questionText, 
            type: questionType, 
            answers: answers 
        });
    });

    return questions;
}

const postLessonForm = document.getElementById('post-lesson-form');
if (postLessonForm) {
    postLessonForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const lessonTitle = document.getElementById('lesson-title').value;
        const lessonDescription = document.getElementById('lesson-description').value;
        const lessonFile = document.getElementById('lesson-file').files[0];
        const lessonVideo = document.getElementById('lesson-video').value;
        const username = currentUser.username;

        const reader = new FileReader();
        const timestamp = new Date().getTime(); // Add a timestamp for sorting

        reader.onload = function(e) {
            firebase.database().ref('lessons/').push({
                title: lessonTitle,
                description: lessonDescription,
                file: lessonFile ? e.target.result : null,
                video: lessonVideo,
                username: username,
                timestamp: timestamp
            }).then(() => {
                alert('Lesson posted successfully!');
                postLessonForm.reset();
                loadLessons();
            });
                        
        }
        if (lessonFile) {
            reader.readAsDataURL(lessonFile);
        } else {
            firebase.database().ref('lessons/').push({
                title: lessonTitle,
                description: lessonDescription,
                file: null,
                video: lessonVideo,
                username: username,
                timestamp: timestamp
            }).then(() => {
                alert('Lesson posted successfully!');
                postLessonForm.reset();
                loadLessons();
            });
                        
        }
    });
}



//     // Admin Dashboard
//     const postQuizForm = document.getElementById('post-quiz-form');
//     if (postQuizForm) {
//         postQuizForm.addEventListener('submit', (event) => {
//             event.preventDefault();
//             const quizTitle = document.getElementById('quiz-title').value;
//             const quizDescription = document.getElementById('quiz-description').value;
//             const quizFile = document.getElementById('quiz-file').files[0];
//             const quizVideo = document.getElementById('quiz-video').value;
//             const username = currentUser.username;

//             const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
//             const reader = new FileReader();
//             reader.onload = function(e) {
//                 quizzes.push({ title: quizTitle, description: quizDescription, file: e.target.result, video: quizVideo, username });
//                 localStorage.setItem('quizzes', JSON.stringify(quizzes));
//                 alert('Quiz posted successfully!');
//                 postQuizForm.reset();
//                 loadLessons();
//             }
//             if (quizFile) {
//                 reader.readAsDataURL(quizFile);
//             } else {
//                 quizzes.push({ title: quizTitle, description: quizDescription, file: null, video: quizVideo, username });
//                 localStorage.setItem('quizzes', JSON.stringify(quizzes));
//                 alert('Quiz posted successfully!');
//                 postQuizForm.reset();
//                 loadLessons();
//             }
//         });
//     }

//     const postLessonForm = document.getElementById('post-lesson-form');
// if (postLessonForm) {
//     postLessonForm.addEventListener('submit', (event) => {
//         event.preventDefault();
//         const lessonTitle = document.getElementById('lesson-title').value;
//         const lessonDescription = document.getElementById('lesson-description').value;
//         const lessonFile = document.getElementById('lesson-file').files[0];
//         const lessonVideo = document.getElementById('lesson-video').value;
//         const username = currentUser.username;
        

//         const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
//         const reader = new FileReader();
//         reader.onload = function(e) {
//             lessons.push({ title: lessonTitle, description: lessonDescription, file: e.target.result, video: lessonVideo, username });
//             localStorage.setItem('lessons', JSON.stringify(lessons));
//             alert('Lesson posted successfully!');
//             postLessonForm.reset();
//             loadLessons();
//         }
//         if (lessonFile) {
//             reader.readAsDataURL(lessonFile);
//         } else {
//             lessons.push({ title: lessonTitle, description: lessonDescription, file: null, video: lessonVideo, username });
//             localStorage.setItem('lessons', JSON.stringify(lessons));
//             alert('Lesson posted successfully!');
//             postLessonForm.reset();
//             loadLessons();
//         }
//     });
// }

   
    // Lesson and Quiz Submission
    const quizAnswerForm = document.getElementById('quiz-answer-form');
    if (quizAnswerForm) {
        quizAnswerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const answer = document.getElementById('quiz-answer').value;
            const answerFile = document.getElementById('quiz-answer-file').files[0];
            const username = currentUser.username;
            const title = new URLSearchParams(window.location.search).get('title');

            const submissions = JSON.parse(localStorage.getItem('submissions')) || {};
            if (!submissions[username]) {
                submissions[username] = {};
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                submissions[username][`quiz-${title}`] = { answer, file: e.target.result };
                localStorage.setItem('submissions', JSON.stringify(submissions));
                document.getElementById('submitted-answer').innerHTML = `<p>Your answer has been submitted.</p>`;
                markAsSubmitted('quiz', title);
            }
            if (answerFile) {
                reader.readAsDataURL(answerFile);
            } else {
                submissions[username][`quiz-${title}`] = { answer, file: null };
                localStorage.setItem('submissions', JSON.stringify(submissions));
                document.getElementById('submitted-answer').innerHTML = `<p>Your answer has been submitted.</p>`;
                markAsSubmitted('quiz', title);
            }
        });
    }

    const lessonAnswerForm = document.getElementById('lesson-answer-form');
    if (lessonAnswerForm) {
        lessonAnswerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const answer = document.getElementById('lesson-answer').value;
            const answerFile = document.getElementById('lesson-answer-file').files[0];
            const username = currentUser.username;
            const title = new URLSearchParams(window.location.search).get('title');

            const submissions = JSON.parse(localStorage.getItem('submissions')) || {};
            if (!submissions[username]) {
                submissions[username] = {};
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                submissions[username][`lesson-${title}`] = { answer, file: e.target.result };
                localStorage.setItem('submissions', JSON.stringify(submissions));
                document.getElementById('submitted-answer').innerHTML = `<p>Your answer has been submitted.</p>`;
                markAsSubmitted('lesson', title);
            }
            if (answerFile) {
                reader.readAsDataURL(answerFile);
            } else {
                submissions[username][`lesson-${title}`] = { answer, file: null };
                localStorage.setItem('submissions', JSON.stringify(submissions));
                document.getElementById('submitted-answer').innerHTML = `<p>Your answer has been submitted.</p>`;
                markAsSubmitted('lesson', title);
            }
        });
    }

    function markAsSubmitted(type, title) {
        let submissions = JSON.parse(localStorage.getItem('submissions')) || {};
        if (!submissions[currentUser.username]) {
            submissions[currentUser.username] = {};
        }
        submissions[currentUser.username][`${type}-${title}`] = true;
        localStorage.setItem('submissions', JSON.stringify(submissions));
        loadLessons();
        updateProgressBar('lesson-progress-container', 'lesson-fraction', 'lesson');
        updateProgressBar('lesson-progress-container', 'lesson-fraction', 'quiz');
    }

    // Load resolved forum posts if on resolved_forum.html
    if (document.getElementById('resolved-questions-list')) {
        loadResolvedForumPosts();
    }

    // Admin: Load and manage users
    if (currentUser && currentUser.isAdmin && document.getElementById('users-list')) {
        loadUsers();
    }

    function loadUsers() {
        const users = Object.keys(localStorage)
            .filter(key => key.startsWith('user-'))
            .map(key => key.replace('user-', ''));
        const usersList = document.getElementById('users-list');
        if (usersList) {
            usersList.innerHTML = '';
            users.forEach(username => {
                const userElement = document.createElement('div');
                userElement.classList.add('user');
                userElement.innerHTML = `
                    <p>Username: ${capitalizeUsername(username)}</p>
                    <button class="delete-button" data-username="${username}">Delete</button>
                `;
                usersList.appendChild(userElement);
            });

            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const username = event.target.dataset.username;
                    localStorage.removeItem(`user-${username}`);
                    localStorage.removeItem(`password-${username}`);
                    if (localStorage.getItem('currentUser') && JSON.parse(localStorage.getItem('currentUser')).username === username) {
                        localStorage.removeItem('currentUser');
                        location.href = 'index.html';
                    } else {
                        loadUsers();
                    }
                });
            });
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        document.getElementById('user-section').innerHTML = `
            <span>Welcome, ${capitalizeUsername(currentUser.username)}</span>
            <a href="#" id="logout-link">Logout</a>
        `;
        document.getElementById('logout-link').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            location.reload();
        });

        // Display admin link if the user is an admin
        if (currentUser.isAdmin) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            // adminLink.textContent = 'Admin';
            // document.querySelector('nav').appendChild(adminLink);
        }
    } else {
        document.getElementById('user-section').innerHTML = `<a href="login.html">Login</a>`;
    }

    // Load questions posts when on questions.html
    if (document.getElementById('questions-list')) {
        loadQuestions();
    }

    // Load resolved questions if on resolved_questions.html
    if (document.getElementById('resolved-questions-list')) {
        loadResolvedQuestions();
    }

    // Posting a new question
    const postQuestionForm = document.getElementById('post-question-form');
    if (postQuestionForm) {
        postQuestionForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const questionTitle = document.getElementById('question-title').value;
            const questionBody = document.getElementById('question-body').value;
            const questionFile = document.getElementById('question-file').files[0];
            const username = currentUser.username;

            const questionsPosts = JSON.parse(localStorage.getItem('questionsPosts')) || [];
            const reader = new FileReader();
            reader.onload = function(e) {
                questionsPosts.push({ title: questionTitle, body: questionBody, file: e.target.result, username, resolved: false });
                localStorage.setItem('questionsPosts', JSON.stringify(questionsPosts));
                alert('Question posted successfully!');
                postQuestionForm.reset();
                loadQuestions(); // Reload the questions list
            }
            if (questionFile) {
                reader.readAsDataURL(questionFile);
            } else {
                questionsPosts.push({ title: questionTitle, body: questionBody, file: null, username, resolved: false });
                localStorage.setItem('questionsPosts', JSON.stringify(questionsPosts));
                alert('Question posted successfully!');
                postQuestionForm.reset();
                loadQuestions(); // Reload the questions list
            }
        });
    }

    // Helper functions
    function capitalizeUsername(username) {
        return username.charAt(0).toUpperCase() + username.slice(1);
    }

    function loadQuestions() {
        const questionsPosts = JSON.parse(localStorage.getItem('questionsPosts')) || [];
        const questionsList = document.getElementById('questions-list');
        if (questionsList) {
            questionsList.innerHTML = ''; // Clear the list before appending new items
            questionsPosts.forEach((post, index) => {
                if (!post.resolved) {
                    const postElement = document.createElement('div');
                    postElement.classList.add('question');
                    postElement.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.body}</p>
                        ${post.file ? `<a href="${post.file}" download>Download Attachment</a>` : ''}
                        <span>Posted by: ${capitalizeUsername(post.username)}</span>
                        <button class="reply-button" data-index="${index}">Reply</button>
                        ${(currentUser.isAdmin || currentUser.username === post.username) ? `<button class="resolve-button" data-index="${index}">Resolve</button>` : ''}
                        ${currentUser.isAdmin ? `<button class="delete-button" data-index="${index}">Delete</button>` : ''}
                        <div class="replies" id="replies-${index}"></div>
                    `;
                    questionsList.appendChild(postElement);
                }
            });

            document.querySelectorAll('.reply-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const index = event.target.dataset.index;
                    const replyText = prompt('Enter your reply:');
                    if (replyText) {
                        const questionsPosts = JSON.parse(localStorage.getItem('questionsPosts')) || [];
                        if (!questionsPosts[index].replies) {
                            questionsPosts[index].replies = [];
                        }
                        questionsPosts[index].replies.push({ username: currentUser.username, text: replyText });
                        localStorage.setItem('questionsPosts', JSON.stringify(questionsPosts));
                        loadQuestions();
                    }
                });
            });

            document.querySelectorAll('.resolve-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const index = event.target.dataset.index;
                    const questionsPosts = JSON.parse(localStorage.getItem('questionsPosts')) || [];
                    questionsPosts[index].resolved = true;
                    localStorage.setItem('questionsPosts', JSON.stringify(questionsPosts));
                    loadQuestions();
                });
            });

            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const index = event.target.dataset.index;
                    const questionsPosts = JSON.parse(localStorage.getItem('questionsPosts')) || [];
                    questionsPosts.splice(index, 1);
                    localStorage.setItem('questionsPosts', JSON.stringify(questionsPosts));
                    loadQuestions();
                });
            });

            questionsPosts.forEach((post, index) => {
                const repliesContainer = document.getElementById(`replies-${index}`);
                if (repliesContainer && post.replies) {
                    post.replies.forEach(reply => {
                        const replyElement = document.createElement('div');
                        replyElement.classList.add('reply');
                        replyElement.innerHTML = `
                            <p><strong>${capitalizeUsername(reply.username)}</strong>: ${reply.text}</p>
                        `;
                        repliesContainer.appendChild(replyElement);
                    });
                }
            });
        }
    }

    function loadResolvedQuestions() {
        const questionsPosts = JSON.parse(localStorage.getItem('questionsPosts')) || [];
        const resolvedQuestionsList = document.getElementById('resolved-questions-list');
        if (resolvedQuestionsList) {
            resolvedQuestionsList.innerHTML = ''; // Clear the list before appending new items
            questionsPosts.forEach((post, index) => {
                if (post.resolved) {
                    const postElement = document.createElement('div');
                    postElement.classList.add('question');
                    postElement.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.body}</p>
                        ${post.file ? `<a href="${post.file}" download>Download Attachment</a>` : ''}
                        <span>Posted by: ${capitalizeUsername(post.username)}</span>
                        ${currentUser.isAdmin ? `<button class="delete-button" data-index="${index}">Delete</button>` : ''}
                        <div class="replies" id="replies-${index}"></div>
                    `;
                    resolvedQuestionsList.appendChild(postElement);
                }
            });

            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const index = event.target.dataset.index;
                    const questionsPosts = JSON.parse(localStorage.getItem('questionsPosts')) || [];
                    questionsPosts.splice(index, 1);
                    localStorage.setItem('questionsPosts', JSON.stringify(questionsPosts));
                    loadResolvedQuestions();
                });
            });

            questionsPosts.forEach((post, index) => {
                const repliesContainer = document.getElementById(`replies-${index}`);
                if (repliesContainer && post.replies) {
                    post.replies.forEach(reply => {
                        const replyElement = document.createElement('div');
                        replyElement.classList.add('reply');
                        replyElement.innerHTML = `
                            <p><strong>${capitalizeUsername(reply.username)}</strong>: ${reply.text}</p>
                        `;
                        repliesContainer.appendChild(replyElement);
                    });
                }
            });
        }
    }
});
function resetLocalStorage() {
    localStorage.clear();
    alert('All data has been reset.');
    location.reload(); // Reload the page to reflect the changes
}

// Example of how to call the function, e.g., via a button click
document.getElementById('reset-button').addEventListener('click', resetLocalStorage);


    function capitalizeUsername(username) {
        return username.charAt(0).toUpperCase() + username.slice(1);
    }



    function showReminderPopup() {
        alert('Don\'t forget to check off this lesson in the lessons page!');
    }






//Flashcards!

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Load user flashcard stacks if on my_flashcards.html
    if (document.getElementById('flashcard-stacks') && window.location.pathname.includes('my_flashcards.html')) {
        loadUserFlashcardStacks();
    }

    // Load all flashcard stacks if on all_flashcards.html
    if (document.getElementById('flashcard-stacks') && window.location.pathname.includes('all_flashcards.html')) {
        loadAllFlashcardStacks();
    }

    // Load a specific flashcard stack if on flashcard_stack.html
    if (document.getElementById('flashcard-stack') && window.location.pathname.includes('flashcard_stack.html')) {
        loadFlashcardStack();
    }

    function loadUserFlashcardStacks() {
        const flashcardStacks = JSON.parse(localStorage.getItem('flashcardStacks')) || [];
        const userStacks = flashcardStacks.filter(stack => stack.username === currentUser.username);
        const flashcardStacksContainer = document.getElementById('flashcard-stacks');

        userStacks.forEach((stack) => {
            const stackElement = document.createElement('a');
            stackElement.classList.add('stack-link');
            stackElement.href = `flashcard_stack.html?name=${stack.stackName}`;
            stackElement.textContent = `${stack.stackName}`;
            flashcardStacksContainer.appendChild(stackElement);

            // Add edit and delete buttons
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-button');
            editButton.dataset.name = stack.stackName;
            stackElement.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
            deleteButton.dataset.name = stack.stackName;
            stackElement.appendChild(deleteButton);

            editButton.addEventListener('click', handleEditStack);
            deleteButton.addEventListener('click', handleDeleteStack);
        });
    }

    function loadAllFlashcardStacks() {
        const flashcardStacks = JSON.parse(localStorage.getItem('flashcardStacks')) || [];
        const flashcardStacksContainer = document.getElementById('flashcard-stacks');

        flashcardStacks.forEach((stack) => {
            const stackElement = document.createElement('a');
            stackElement.classList.add('stack-link');
            stackElement.href = `flashcard_stack.html?name=${stack.stackName}`;
            stackElement.textContent = `${stack.stackName} by ${capitalizeUsername(stack.username)}`;
            flashcardStacksContainer.appendChild(stackElement);

            // Add edit and delete buttons for admins
            if (currentUser.isAdmin || currentUser.username === stack.username) {
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.classList.add('edit-button');
                editButton.dataset.name = stack.stackName;
                stackElement.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-button');
                deleteButton.dataset.name = stack.stackName;
                stackElement.appendChild(deleteButton);

                editButton.addEventListener('click', handleEditStack);
                deleteButton.addEventListener('click', handleDeleteStack);
            }
        });
    }

    function loadFlashcardStack() {
        const stackName = new URLSearchParams(window.location.search).get('name');
        const flashcardStacks = JSON.parse(localStorage.getItem('flashcardStacks')) || [];
        const stack = flashcardStacks.find(s => s.stackName === stackName);
        const flashcardStackContainer = document.getElementById('flashcard-stack');
        const stackNameElement = document.getElementById('stack-name');
        const rotateAllButton = document.getElementById('rotate-all-button');
        let allFlipped = false;

        if (stack) {
            stackNameElement.textContent = stack.stackName;
            stack.cards.forEach((card, cardIndex) => {
                const cardElement = document.createElement('div');
                cardElement.classList.add('flashcard');
                cardElement.dataset.index = cardIndex;
                cardElement.dataset.colorScheme = card.colorScheme;
                cardElement.innerHTML = `
                    <div class="front">
                        <p>${card.front}</p>
                        <p>Side 1</p>
                    </div>
                    <div class="back">
                        <p>${card.back}</p>
                        <p>Side 2</p>
                    </div>
                    <div class="thumbs">
                        <button class="thumb-up" data-index="${cardIndex}">&#128077;</button>
                        <button class="thumb-down" data-index="${cardIndex}">&#128078;</button>
                    </div>
                `;
                cardElement.style.borderColor = card.colorScheme;
                flashcardStackContainer.appendChild(cardElement);

                cardElement.addEventListener('click', () => {
                    cardElement.classList.toggle('flip');
                });
            });

            document.querySelectorAll('.thumb-up').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent the card from flipping when clicking the thumbs
                    const cardIndex = event.target.dataset.index;
                    handleThumbsUp(cardIndex);
                });
            });

            document.querySelectorAll('.thumb-down').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.stopPropagation(); // Prevent the card from flipping when clicking the thumbs
                    const cardIndex = event.target.dataset.index;
                    handleThumbsDown(cardIndex);
                });
            });

            rotateAllButton.addEventListener('click', () => {
                allFlipped = !allFlipped;
                document.querySelectorAll('.flashcard').forEach(card => {
                    if (allFlipped) {
                        card.classList.add('flip');
                    } else {
                        card.classList.remove('flip');
                    }
                });
            });
        }

        function handleThumbsUp(cardIndex) {
            const card = document.querySelector(`.flashcard[data-index="${cardIndex}"]`);
            card.classList.add('green');
            card.classList.remove('red');
        }

        function handleThumbsDown(cardIndex) {
            const card = document.querySelector(`.flashcard[data-index="${cardIndex}"]`);
            card.classList.add('red');
            card.classList.remove('green');
        }
    }

    function handleEditStack(event) {
        const stackName = event.target.dataset.name;
        const flashcardStacks = JSON.parse(localStorage.getItem('flashcardStacks')) || [];
        const stack = flashcardStacks.find(s => s.stackName === stackName);
        if (stack) {
            const newStackName = prompt('Edit Stack Name:', stack.stackName);
            if (newStackName) {
                stack.stackName = newStackName;
                localStorage.setItem('flashcardStacks', JSON.stringify(flashcardStacks));
                alert('Stack updated successfully!');
                location.reload();
            }
        }
    }

    function handleDeleteStack(event) {
        const stackName = event.target.dataset.name;
        let flashcardStacks = JSON.parse(localStorage.getItem('flashcardStacks')) || [];
        flashcardStacks = flashcardStacks.filter(stack => stack.stackName !== stackName);
        localStorage.setItem('flashcardStacks', JSON.stringify(flashcardStacks));
        alert('Stack deleted successfully!');
        location.reload();
    }

    function capitalizeUsername(username) {
        return username.charAt(0).toUpperCase() + username.slice(1);
    }
});
//Updated Forms
function populateOrderDropdown() {
    const lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    const allItems = lessons.concat(quizzes).map(item => item.title);

    const lessonOrderDropdown = document.getElementById('lesson-order');
    const quizOrderDropdown = document.getElementById('quiz-order');

    allItems.forEach((title, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = title;
        lessonOrderDropdown.appendChild(option.cloneNode(true));
        quizOrderDropdown.appendChild(option.cloneNode(true));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Populate the order dropdowns
    if (document.getElementById('lesson-order') || document.getElementById('quiz-order')) {
        populateOrderDropdown();
    }
});


//Quiz Builder Multiple Choice
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        document.getElementById('user-section').innerHTML = `
            <span>Welcome, ${capitalizeUsername(currentUser.username)}</span>
            <a href="#" id="logout-link">Logout</a>
        `;
        document.getElementById('logout-link').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            location.reload();
        });

        // Display admin link if the user is an admin
        if (currentUser.isAdmin) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
         
        }
    } else {
        document.getElementById('user-section').innerHTML = `<a href="login.html">Login</a>`;
    }

    // Quiz Builder Functionality
    document.addEventListener('DOMContentLoaded', () => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
        if (currentUser) {
            document.getElementById('user-section').innerHTML = `
                <span>Welcome, ${capitalizeUsername(currentUser.username)}</span>
                <a href="#" id="logout-link">Logout</a>
            `;
            document.getElementById('logout-link').addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                location.reload();
            });
    
            // Display admin link if the user is an admin
            if (currentUser.isAdmin) {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.textContent = 'Admin';
                document.querySelector('nav').appendChild(adminLink);
            }
        } else {
            document.getElementById('user-section').innerHTML = `<a href="login.html">Login</a>`;
        }
    
        // Quiz Builder Functionality
       document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser) {
        document.getElementById('user-section').innerHTML = `
            <span>Welcome, ${capitalizeUsername(currentUser.username)}</span>
            <a href="#" id="logout-link">Logout</a>
        `;
        document.getElementById('logout-link').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            location.reload();
        });

        // Display admin link if the user is an admin
        if (currentUser.isAdmin) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.textContent = 'Admin';
            document.querySelector('nav').appendChild(adminLink);
        }
    } else {
        document.getElementById('user-section').innerHTML = `<a href="login.html">Login</a>`;
    }

    // Quiz Detail Page Functionality





       });
    });
});














































//Editing features

// Function to save the current state of the page
function savePage() {
const pageContent = document.documentElement.outerHTML;
localStorage.setItem(window.location.pathname, pageContent);
}

// Function to load the saved state of the page
function loadPage() {
const savedContent = localStorage.getItem(window.location.pathname);
if (savedContent) {
    document.open();
    document.write(savedContent);
    document.close();
}
}

// Load saved page content on page load
window.onload = () => {
loadPage();
playSavedAnimations();
addListenersToAll(); // Add listeners to all elements on page load
closeAllDropdowns();
};

// Save button event listener
document.getElementById('save-button').addEventListener('click', () => {
savePage();
alert('Page saved successfully!');
});

// Add click event listeners to all editable elements
document.querySelectorAll('[contenteditable="true"]').forEach(element => {
element.addEventListener('click', (event) => showEditOptions(event, element));
element.addEventListener('contextmenu', (event) => showRightClickOptions(event, element));
});

// Show dropdown menu for editing options
function showEditOptions(event, element) {
closeAllDropdowns(); // Close any existing dropdowns

const dropdown = document.createElement('div');
dropdown.classList.add('edit-dropdown');
dropdown.innerHTML = `
    <div class="dropdown-header">
        <button class="close-dropdown" unselectable="on">X</button>
        <div class="drag-dropdown" unselectable="on">⬤</div>
    </div>
    <div class="dropdown-content">
        <div class="dropdown-tabs">
            <button class="tablink" onclick="openTab(event, 'Text')">Text</button>
            <button class="tablink" onclick="openTab(event, 'Background')">Background</button>
            <button class="tablink" onclick="openTab(event, 'Border')">Border</button>
            <button class="tablink" onclick="openTab(event, 'Other')">Other</button>
        </div>
        <div id="Text" class="tabcontent">
            <label>Font: <select id="font-family">
                <option value="Arial" style="font-family: Arial;">Arial</option>
                <option value="Verdana" style="font-family: Verdana;">Verdana</option>
                <option value="Times New Roman" style="font-family: 'Times New Roman';">Times New Roman</option>
                <option value="Courier New" style="font-family: 'Courier New';">Courier New</option>
                <option value="Georgia" style="font-family: Georgia;">Georgia</option>
                <option value="Helvetica" style="font-family: Helvetica;">Helvetica</option>
                <option value="Tahoma" style="font-family: Tahoma;">Tahoma</option>
                <option value="Trebuchet MS" style="font-family: 'Trebuchet MS';">Trebuchet MS</option>
                <option value="Impact" style="font-family: Impact;">Impact</option>
                <option value="Comic Sans MS" style="font-family: 'Comic Sans MS';">Comic Sans MS</option>
            </select></label>
            <label>Font Size: <input type="number" id="font-size" value="${window.getComputedStyle(element).fontSize.replace('px', '')}"></label>
            <label>Font Color: <input type="color" id="font-color" value="${rgbToHex(window.getComputedStyle(element).color)}"></label>
            <label>Text Align: <select id="text-align">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
            </select></label>
            <label>Bullet Points: <button id="add-bullets">Add Bullet Points</button></label>
            <label>Add Internal Link: 
                <input type="text" id="internal-link-text" placeholder="Link Text">
                <select id="internal-link-page">
                    <option value="index.html">Home</option>
                    <option value="lessons.html">Lessons</option>
                    <option value="progress.html">Progress</option>
                    <option value="forum.html">Forum</option>
                    <option value="resources.html">Resources</option>
                </select>
                <button id="add-internal-link">Add Link</button>
            </label>
            <label>Add External Link: 
                <input type="text" id="external-link-text" placeholder="Link Text">
                <input type="url" id="external-link-url" placeholder="https://example.com">
                <button id="add-external-link">Add Link</button>
            </label>
        </div>
        <div id="Background" class="tabcontent">
            <label>Background Color: <input type="color" id="background-color" value="${rgbToHex(window.getComputedStyle(element).backgroundColor)}"></label>
            <label>Make Background Transparent: <input type="checkbox" id="background-transparent"></label>
            <label>Add Image as Background: <input type="file" id="textbox-background-image"></label>
            <label>Remove Image from Background: <button id="remove-textbox-background-image">Remove</button></label>
        </div>
        <div id="Border" class="tabcontent">
            <label>Border Width: <input type="number" id="border-width" value="${window.getComputedStyle(element).borderWidth.replace('px', '')}"></label>
            <label>Border Color: <input type="color" id="border-color" value="${rgbToHex(window.getComputedStyle(element).borderColor)}"></label>
            <label>Border Style: <select id="border-style">
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="double">Double</option>
                <option value="groove">Groove</option>
                <option value="ridge">Ridge</option>
                <option value="inset">Inset</option>
                <option value="outset">Outset</option>
            </select></label>
            <label>Border Radius: <input type="number" id="border-radius" value="${window.getComputedStyle(element).borderRadius.replace('px', '')}"></label>
        </div>
        <div id="Other" class="tabcontent">
            <label>Animation: <select id="animation">
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
            </select></label>
            <label>Add Image/Video: <input type="file" id="media"></label>
            <label>Add YouTube Video: <input type="text" id="youtube-url" placeholder="Enter YouTube URL"></label>
            <label>Layer Order: <select id="layer-order">
                <option value="front">Move to Front</option>
                <option value="back">Move to Back</option>
            </select></label>
            ${element.tagName === 'A' ? '<button id="go-to-link">Go to Link</button>' : ''}
            ${element.id === 'header' ? '<label>Height: <input type="number" id="element-height" value="' + window.getComputedStyle(element).height.replace('px', '') + '"></label>' : ''}
            <label>Width: <input type="number" id="element-width" value="${element.clientWidth}" step="10"></label>
            <label>Height: <input type="number" id="element-height" value="${element.clientHeight}" step="10"></label>
            <label>Page Length: <input type="number" id="page-length" value="${document.documentElement.clientHeight}" step="10"></label>
            <label>Move: <div class="move-buttons">
                <button id="move-up">↑</button>
                <button id="move-down">↓</button>
                <button id="move-left">←</button>
                <button id="move-right">→</button>
            </div></label>
            <button id="delete-element">Delete Element</button>
        </div>
    </div>
`;
document.body.appendChild(dropdown);
positionDropdown(dropdown, event);

// Initialize dropdown values to the element's current styles
document.getElementById('font-family').value = window.getComputedStyle(element).fontFamily;
document.getElementById('border-style').value = window.getComputedStyle(element).borderStyle;
document.getElementById('text-align').value = window.getComputedStyle(element).textAlign;

// Close dropdown button
document.querySelector('.close-dropdown').addEventListener('click', () => dropdown.remove());

// Make dropdown draggable
const dragDropdown = document.querySelector('.drag-dropdown');
dragDropdown.addEventListener('mousedown', dragStartDropdown);

// Set dropdown values to current styles
document.getElementById('font-family').addEventListener('change', () => {
    element.style.fontFamily = document.getElementById('font-family').value;
    saveChanges(element);
});
document.getElementById('font-size').addEventListener('input', () => {
    element.style.fontSize = `${document.getElementById('font-size').value}px`;
    saveChanges(element);
});
document.getElementById('font-color').addEventListener('input', () => {
    element.style.color = document.getElementById('font-color').value;
    saveChanges(element);
});
document.getElementById('text-align').addEventListener('change', () => {
    element.style.textAlign = document.getElementById('text-align').value;
    saveChanges(element);
});
document.getElementById('background-color').addEventListener('input', () => {
    element.style.backgroundColor = document.getElementById('background-color').value;
    document.getElementById('background-transparent').checked = false; // Uncheck the transparent background if a color is chosen
    saveChanges(element);
});
document.getElementById('background-transparent').addEventListener('change', () => {
    element.style.backgroundColor = document.getElementById('background-transparent').checked ? 'transparent' : document.getElementById('background-color').value;
    saveChanges(element);
});
document.getElementById('textbox-background-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        element.style.backgroundImage = `url(${event.target.result})`;
        saveChanges(element);
    };
    reader.readAsDataURL(file);
});
document.getElementById('remove-textbox-background-image').addEventListener('click', () => {
    element.style.backgroundImage = 'none';
    saveChanges(element);
});
document.getElementById('border-width').addEventListener('input', () => {
    element.style.borderWidth = `${document.getElementById('border-width').value}px`;
    element.style.borderStyle = 'solid';
    saveChanges(element);
});
document.getElementById('border-color').addEventListener('input', () => {
    element.style.borderColor = document.getElementById('border-color').value;
    saveChanges(element);
});
document.getElementById('border-style').addEventListener('change', () => {
    element.style.borderStyle = document.getElementById('border-style').value;
    saveChanges(element);
});
document.getElementById('border-radius').addEventListener('input', () => {
    element.style.borderRadius = `${document.getElementById('border-radius').value}px`;
    saveChanges(element);
});
document.getElementById('animation').addEventListener('change', () => {
    element.style.animation = document.getElementById('animation').value;
    saveChanges(element);
});
document.getElementById('layer-order').addEventListener('change', () => {
    if (document.getElementById('layer-order').value === 'front') {
        element.style.zIndex = 1000; // Move element to front
    } else {
        element.style.zIndex = -1; // Move element to back
    }
    saveChanges(element);
});
document.getElementById('media').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        const mediaElement = file.type.startsWith('image') ? new Image() : document.createElement('video');
        mediaElement.src = event.target.result;
        mediaElement.controls = true;
        mediaElement.classList.add('draggable');
        element.appendChild(mediaElement);
        addImageSizeDropdown(mediaElement);
        saveChanges(element);
    };
    reader.readAsDataURL(file);
});
document.getElementById('youtube-url').addEventListener('input', () => {
    const url = document.getElementById('youtube-url').value;
    if (url) {
        const youtubeEmbed = document.createElement('iframe');
        youtubeEmbed.width = "560";
        youtubeEmbed.height = "315";
        youtubeEmbed.src = `https://www.youtube.com/embed/${extractYouTubeID(url)}`;
        youtubeEmbed.frameBorder = "0";
        youtubeEmbed.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        youtubeEmbed.allowFullscreen = true;
        element.appendChild(youtubeEmbed);
        saveChanges(element);
    }
});
document.getElementById('element-width').addEventListener('input', () => {
    element.style.width = `${document.getElementById('element-width').value}px`;
    saveChanges(element);
});
document.getElementById('element-height').addEventListener('input', () => {
    element.style.height = `${document.getElementById('element-height').value}px`;
    saveChanges(element);
});
document.getElementById('page-length').addEventListener('input', () => {
    document.querySelector('main').style.minHeight = `${document.getElementById('page-length').value}px`;
    savePage();
});

// Height adjustment for header
if (element.id === 'header') {
    document.getElementById('element-height').addEventListener('input', () => {
        element.style.height = `${document.getElementById('element-height').value}px`;
    });
}

// Go to link functionality
if (element.tagName === 'A') {
    document.getElementById('go-to-link').addEventListener('click', () => {
        window.location.href = element.href;
    });
}

// Add bullet points to textboxes
document.getElementById('add-bullets').addEventListener('click', () => {
    document.execCommand('insertUnorderedList');
    saveChanges(element);
});

// Move element functionality
document.getElementById('move-up').addEventListener('click', () => moveElement(element, 'up'));
document.getElementById('move-down').addEventListener('click', () => moveElement(element, 'down'));
document.getElementById('move-left').addEventListener('click', () => moveElement(element, 'left'));
document.getElementById('move-right').addEventListener('click', () => moveElement(element, 'right'));

// Delete element functionality
document.getElementById('delete-element').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this element?')) {
        element.remove();
        savePage();
    }
});

// Add internal link functionality
document.getElementById('add-internal-link').addEventListener('click', () => {
    const linkText = document.getElementById('internal-link-text').value;
    const linkPage = document.getElementById('internal-link-page').value;
    if (linkText && linkPage) {
        const link = document.createElement('a');
        link.href = linkPage;
        link.textContent = linkText;
        element.appendChild(link);
        saveChanges(element);
    }
});

// Add external link functionality
document.getElementById('add-external-link').addEventListener('click', () => {
    const linkText = document.getElementById('external-link-text').value;
    const linkUrl = document.getElementById('external-link-url').value;
    if (linkText && linkUrl) {
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = linkText;
        link.target = '_blank'; // Open in new tab
        element.appendChild(link);
        saveChanges(element);
    }
});

function saveChanges(element) {
    // Auto save changes when an input value changes, except for height adjustment of header
    if (element.id !== 'header') {
        const pageContent = document.documentElement.outerHTML;
        localStorage.setItem(window.location.pathname, pageContent);
    }
}
}

// Move element function
function moveElement(element, direction) {
const step = 10; // Step size for moving elements
const currentTop = parseInt(window.getComputedStyle(element).top, 10) || 0;
const currentLeft = parseInt(window.getComputedStyle(element).left, 10) || 0;

// Move the element based on the direction
if (direction === 'up') {
    element.style.top = `${currentTop - step}px`;
} else if (direction === 'down') {
    element.style.top = `${currentTop + step}px`;
} else if (direction === 'left') {
    element.style.left = `${currentLeft - step}px`;
} else if (direction === 'right') {
    element.style.left = `${currentLeft + step}px`;
}

// Save the page after moving the element
savePage();
}

// Function to show right-click options
function showRightClickOptions(event, element) {
event.preventDefault();
closeAllDropdowns(); // Close any existing dropdowns

const dropdown = document.createElement('div');
dropdown.classList.add('right-click-dropdown');
dropdown.innerHTML = `
    <div class="dropdown-header">
        <button class="close-dropdown" unselectable="on">X</button>
        <div class="drag-dropdown" unselectable="on">⬤</div>
    </div>
    <div class="dropdown-content">
        <label>Area Color: <input type="color" id="right-background-color" value="${rgbToHex(window.getComputedStyle(element).backgroundColor)}"></label>
        <label>Add Textbox: <button id="add-textbox">Add</button></label>
        <label>Add Image as Area Background: <input type="file" id="background-image"></label>
        <label>Remove Image from Area Background: <button id="remove-area-background-image">Remove</button></label>
        <label>Change Website Background Color: <input type="color" id="website-background-color"></label>
        <label>Change Website Background Image: <input type="file" id="website-background-image"></label>
        <label>Remove Website Background Image: <button id="remove-background-image">Remove</button></label>
        <label>Menu Alignment: <select id="menu-alignment">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
        </select></label>
    </div>
`;
document.body.appendChild(dropdown);
positionDropdown(dropdown, event);

document.getElementById('right-background-color').addEventListener('input', () => {
    element.style.backgroundColor = document.getElementById('right-background-color').value;
    saveChanges(element);
});
document.getElementById('add-textbox').addEventListener('click', () => {
    const textbox = document.createElement('div');
    textbox.contentEditable = true;
    textbox.classList.add('draggable');
    textbox.innerHTML = 'New Textbox';
    textbox.style.backgroundColor = '#ffffff'; // Ensure the new textbox has its own background color
    textbox.style.marginBottom = '10px'; // Add margin at the bottom
    textbox.style.height = '100px'; // Start new textboxes slightly longer
    element.appendChild(textbox);
    addListeners(textbox);
    saveChanges(element);
});
document.getElementById('background-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        element.style.backgroundImage = `url(${event.target.result})`;
        saveChanges(element);
    };
    reader.readAsDataURL(file);
});
document.getElementById('remove-area-background-image').addEventListener('click', () => {
    element.style.backgroundImage = 'none';
    saveChanges(element);
});
document.getElementById('website-background-color').addEventListener('input', () => {
    document.body.style.backgroundColor = document.getElementById('website-background-color').value;
    savePage();
});
document.getElementById('website-background-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        document.body.style.backgroundImage = `url(${event.target.result})`;
        savePage();
    };
    reader.readAsDataURL(file);
});
document.getElementById('remove-background-image').addEventListener('click', () => {
    document.body.style.backgroundImage = 'none';
    savePage();
});
document.getElementById('menu-alignment').addEventListener('change', () => {
    const alignment = document.getElementById('menu-alignment').value;
    const headerNav = document.querySelector('header nav');
    headerNav.style.justifyContent = alignment === 'left' ? 'flex-start' : alignment === 'center' ? 'center' : 'flex-end';
    savePage();
});

function saveChanges(element) {
    // Auto save changes when an input value changes
    const pageContent = document.documentElement.outerHTML;
    localStorage.setItem(window.location.pathname, pageContent);
}

// Close dropdown button
document.querySelector('.close-dropdown').addEventListener('click', () => dropdown.remove());

// Make dropdown draggable
const dragDropdown = document.querySelector('.drag-dropdown');
dragDropdown.addEventListener('mousedown', dragStartDropdown);
}

// Function to make dropdown draggable
function dragStartDropdown(e) {
e.preventDefault();
document.addEventListener('mousemove', dragMoveDropdown);
document.addEventListener('mouseup', dragEndDropdown);

const initialX = e.clientX;
const initialY = e.clientY;
const dropdown = e.target.closest('.edit-dropdown, .right-click-dropdown');
const rect = dropdown.getBoundingClientRect();

function dragMoveDropdown(e) {
    dropdown.style.top = `${rect.top + (e.clientY - initialY)}px`;
    dropdown.style.left = `${rect.left + (e.clientX - initialX)}px`;
    dropdown.style.cursor = 'move'; // Change cursor to move
}

function dragEndDropdown() {
    document.removeEventListener('mousemove', dragMoveDropdown);
    document.removeEventListener('mouseup', dragEndDropdown);
    dropdown.style.cursor = 'auto'; // Revert cursor back to auto
}
}

// Position dropdown menu
function positionDropdown(dropdown, event) {
const offset = 20; // Adjust the offset as needed
dropdown.style.top = `${event.clientY + offset}px`;
dropdown.style.left = `${event.clientX + offset}px`;

// Ensure the dropdown menu is fully visible
const dropdownRect = dropdown.getBoundingClientRect();
if (dropdownRect.bottom > window.innerHeight) {
    dropdown.style.top = `${window.innerHeight - dropdownRect.height - 10}px`;
}
if (dropdownRect.right > window.innerWidth) {
    dropdown.style.left = `${window.innerWidth - dropdownRect.width - 10}px`;
}
}

// Close all dropdowns
function closeAllDropdowns() {
document.querySelectorAll('.edit-dropdown, .right-click-dropdown').forEach(dropdown => dropdown.remove());
}

// Convert RGB to HEX
function rgbToHex(rgb) {
const result = rgb.match(/\d+/g);
return '#' + result.map(num => {
    const hex = parseInt(num).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}).join('');
}

// Add listeners to textboxes and media
function addListeners(element) {
// Ensure textboxes retain size when text is deleted
element.addEventListener('input', () => {
    if (element.textContent.trim() === '') {
        element.style.height = `${element.clientHeight}px`;
    }
});
}

// Make dropdown draggable
function dragStartDropdown(e) {
e.preventDefault();
document.addEventListener('mousemove', dragMoveDropdown);
document.addEventListener('mouseup', dragEndDropdown);

const initialX = e.clientX;
const initialY = e.clientY;
const dropdown = e.target.closest('.edit-dropdown, .right-click-dropdown');
const rect = dropdown.getBoundingClientRect();

function dragMoveDropdown(e) {
    dropdown.style.top = `${rect.top + (e.clientY - initialY)}px`;
    dropdown.style.left = `${rect.left + (e.clientX - initialX)}px`;
    dropdown.style.cursor = 'move'; // Change cursor to move
}

function dragEndDropdown() {
    document.removeEventListener('mousemove', dragMoveDropdown);
    document.removeEventListener('mouseup', dragEndDropdown);
    dropdown.style.cursor = 'auto'; // Revert cursor back to auto
}
}

// Add listeners to all elements on page load
function addListenersToAll() {
document.querySelectorAll('.draggable').forEach(element => {
    addListeners(element);
});
}

// Add dropdown menu for image resizing
function addImageSizeDropdown(image) {
const dropdown = document.createElement('div');
dropdown.classList.add('edit-dropdown');
dropdown.innerHTML = `
    <div class="dropdown-header">
        <button class="close-dropdown" unselectable="on">X</button>
        <div class="drag-dropdown" unselectable="on">⬤</div>
    </div>
    <div class="dropdown-content">
        <label>Size: <input type="number" id="image-size" value="400" step="10"></label>
    </div>
`;
document.body.appendChild(dropdown);
positionDropdown(dropdown, {clientY: image.offsetTop, clientX: image.offsetLeft});

document.getElementById('image-size').addEventListener('input', () => {
    const size = document.getElementById('image-size').value;
    const aspectRatio = image.naturalWidth / image.naturalHeight;
    image.width = size;
    image.height = size / aspectRatio;
    saveChanges(image);
});

function saveChanges(element) {
    // Auto save changes when an input value changes
    const pageContent = document.documentElement.outerHTML;
    localStorage.setItem(window.location.pathname, pageContent);
}

// Close dropdown button
document.querySelector('.close-dropdown').addEventListener('click', () => dropdown.remove());

// Make dropdown draggable
const dragDropdown = document.querySelector('.drag-dropdown');
dragDropdown.addEventListener('mousedown', dragStartDropdown);
}

// Play saved animations on page load
function playSavedAnimations() {
document.querySelectorAll('[style*="animation"]').forEach(element => {
    element.style.animationPlayState = 'running';
});
}

// Ensure dropdowns reappear when something is clicked on
document.addEventListener('click', (event) => {
const editableElement = event.target.closest('[contenteditable="true"]');
if (editableElement) {
    showEditOptions(event, editableElement);
}
});

// Function to open a tab in the dropdown menu
function openTab(evt, tabName) {
var i, tabcontent, tablinks;
tabcontent = document.getElementsByClassName("tabcontent");
for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
}
tablinks = document.getElementsByClassName("tablink");
for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
}
document.getElementById(tabName).style.display = "block";
evt.currentTarget.className += " active";
}






