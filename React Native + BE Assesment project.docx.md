 **Project: "Mini Social Feed App"**

**🎯 Goal**

Build a **lightweight social media application** where users can:

* Post updates (**text only**)  
* View a shared feed of posts  
* Interact with posts by **liking** and **commenting**  
* Receive **real-time notifications (via Firebase)** when their posts get liked or commented on

The project should include:

* **Backend (Node.js / Express)** → Expose APIs for authentication, posts, likes, and comments  
* **Mobile App (React Native with Expo)** → Add authentication module. Provide a feed, create-post form, and interaction features. Offer a simplified feed and post interaction experience

---

**🔹 Requirements**

**1\. Backend (Node.js \+ Express \+ Database of choice)**

* **Authentication:** Signup/Login using JWT  
* **Post APIs:**  
  * POST /posts → Create a text-only post  
  * GET /posts → Retrieve all posts (paginated, newest first)  
* **Interaction APIs:**  
  * POST /posts/:id/like → Like or unlike a post  
  * POST /posts/:id/comment → Add a comment to a post  
* **Notifications:**  
  * Use **Firebase Cloud Messaging (FCM)** to notify users whenever someone likes or comments on their post

---

---

**2\. Mobile App (React Native \+ Expo)**

* **Login & Signup** screens  
* **Feed:** Scrollable list of posts with like \+ comment buttons \+ filter newsfeed by username  
* **Create Post:** Text-only form to publish new posts  
* **Notifications:** Receive push notifications from Firebase for new likes and comments

---

**🔹 Deliverables**

* **Backend**: Node.js repo with setup instructions (API docs in README).  
* **Mobile**: React Native (Expo project with FCM integration) and APK file.  
* Create a GitHub repo with backend and React Native app folders. Add a proper README file.  
* Share the GitHub URL and Google Drive download link of the APK file.

---

**🔹 Evaluation Criteria**

* **Code Quality:** Clean, modular, and well-documented code  
* **API Design:** Consistent, secure, and properly validated  
* **Frontend:** Functional and user-friendly web interface  
* **Mobile App:** Smooth feed experience and working notifications  
* **Extra Points:**  
  * UI polish and responsiveness. We will test the app on tablet and android phone.  
  * Error handling and validation

