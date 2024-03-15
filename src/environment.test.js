const fs = require('fs');
const path = require('path');

function checkFilesExistence() {
  return new Promise((resolve, reject) => {
    try {
      const itemsToCheck = [path.join(__dirname, '../afters.json'), path.join(__dirname, '../global_url_logs.json')];
      itemsToCheck.forEach(item => {
        if (!fs.existsSync(item)) {
          fs.writeFileSync(item, JSON.stringify({}));
          console.log('\x1b[33m%s\x1b[0m', `[!] Important files that were missing were recreated.`);
        }
      });
      resolve({ check: true, error: null });
    } catch (error) {
      console.log('\x1b[31m%s\x1b[0m', error);
      reject({ check: false, error: error });
    }
  });
}

describe('checkFilesExistence', () => {
  beforeEach(() => {
    // Setup the mock environment before each test
    fs.existsSync = jest.fn();
    fs.writeFileSync = jest.fn();
    console.log = jest.fn();
    path.join = jest.fn();
  });

  it('should resolve with true if all files exist', async () => {
    // Arrange
    fs.existsSync.mockReturnValue(true);

    // Act
    const result = await checkFilesExistence();

    // Assert
    expect(result).toEqual({ check: true, error: null });
    expect(fs.writeFileSync).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should create files and resolve with true if any file does not exist', async () => {
    // Arrange
    fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);
    path.join.mockReturnValueOnce('path/to/afters.json').mockReturnValueOnce('path/to/global_url_logs.json');

    // Act
    const result = await checkFilesExistence();

    // Assert
    expect(result).toEqual({ check: true, error: null });
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith('path/to/afters.json', '{}');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[!] Important files that were missing were recreated.'));
  });

  it('should reject with an error if there is an exception', async () => {
    // Arrange
    const testError = new Error('Test error');
    fs.existsSync.mockImplementation(() => {
      throw testError;
    });

    // Act & Assert
    await expect(checkFilesExistence()).rejects.toEqual({ check: false, error: testError });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(testError.toString()));
  });
});