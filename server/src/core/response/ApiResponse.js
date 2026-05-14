class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  static success(data, message = 'Success', statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static error(message = 'Error', statusCode = 500, data = null) {
    return new ApiResponse(statusCode, data, message);
  }
}

export default ApiResponse;
