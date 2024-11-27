
The server will start on `http://localhost:3000`.

### API Endpoints

- **Create User**
  - **POST** `/user`
  - Request Body:
    ```json
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "birthday": "1990-11-27",
      "location": "Jakarta, Indonesia",
      "timezone": "Asia/Jakarta"
    }
    ```

- **Delete User**
  - **DELETE** `/user/:id`
  - URL Parameter:
    - `id`: The ID of the user to delete.

- **Recover Failed Jobs**
  - **POST** `/recover`
  - This endpoint will attempt to resend any failed birthday emails.

### Cron Job

The application uses a cron job to check for users with birthdays every day at 3:45 PM. If a user's birthday matches the current date, an email will be scheduled to be sent at 9 AM the next day in their local timezone.

### Error Handling

If an email fails to send, the application logs the error and can attempt to resend the email later.

### Testing

You can test the application using tools like Postman or cURL to interact with the API endpoints.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgments

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- [Moment.js](https://momentjs.com/)
- [Node-cron](https://www.npmjs.com/package/node-cron)
- [RabbitMQ](https://www.rabbitmq.com/)
