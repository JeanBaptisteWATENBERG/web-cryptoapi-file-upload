import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {
    isKeyGenerating: false,
    isFileBeingEncrypted: false
  }

  handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      this.setState({ selectedFile: e.target.files[0] });
    }
  }

  generateSecretKey = async () => {
    this.setState({ isKeyGenerating: true })
    const key = await crypto.subtle.generateKey({ name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
    this.setState({ isKeyGenerating: false, key });
    this.encryptFile(key)
  }

  encryptFile = async (key) => {
    this.setState({ isFileBeingEncrypted: true })
    const file = this.state.selectedFile;
    const reader = new FileReader();
    const readed = async () => {
      const request = {};
      const encryptedFile = await crypto.subtle.encrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, key, new Uint8Array(reader.result));
      crypto.subtle.digest('SHA-256', encryptedFile).then((computedHash) => {
        request.encryptedFile = encryptedFile;
        request.blob = new Blob([encryptedFile], { type: 'application/octet-binary' });
        request.type = file.type;
        request.fileHash = computedHash;
        this.setState({ request });
        this.decryptFile(key, encryptedFile)
      });
    };
    reader.addEventListener("loadend", readed, false);
    reader.readAsArrayBuffer(file);
  }

  decryptFile = async (key, encryptedFile) => {
    crypto.subtle.decrypt({ name: "AES-CBC", iv: new Uint8Array(16) }, key, encryptedFile).then((data) => {
      this.setState({
        encryptedContent: btoa(String.fromCharCode.apply(null, new Uint8Array(encryptedFile))),
        decryptedContent: String.fromCharCode.apply(null, new Uint8Array(data))
      });
    });
  }

  render() {
    const { selectedFile, key, isKeyGenerating, request, encryptedContent, decryptedContent } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          {!selectedFile && <>
            <p>
              Select a file to send, file will be encrypted before sending it in your browser.
          </p>
            <input type='file' onChange={this.handleFileUpload} />
          </>}
          {selectedFile && !key && <>
            <p>
              Select a secret key to use to encrypt your file, or generate/import a new one.
          <br />
              Your secrets key will be stored locally in your browser.
          </p>
            <p>
              {!isKeyGenerating && <button onClick={this.generateSecretKey}>Generate a new key</button>}
              {isKeyGenerating && 'A key is being generated...'}
              &nbsp;
              <button><strike>Import a key</strike> (not yet implemented)</button>
            </p>
          </>}
          {key && !request && <>
            <p>File is being encrypted...</p>
          </>}
          {request && <>
            <p>Done</p>
            <table style={{ border: '1px solid black' }}>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'right' }}>Encrypted content (base64 representation)</td>
                  <td style={{ textAlign: 'left', paddingLeft: '5px', border: '1px solid black' }}>{encryptedContent}</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'right' }}>Decrypted content</td>
                  <td style={{ textAlign: 'left', paddingLeft: '5px', border: '1px solid black' }}>{decryptedContent}</td>
                </tr>
              </tbody>
            </table>
          </>}
        </header>
      </div>
    );
  }
}

export default App;
