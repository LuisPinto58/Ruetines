

document.getElementById("newChatButton").addEventListener("click", function() {
    const modalDiv = document.createElement("div");
    modalDiv.innerHTML = `
    <div class="modal fade" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="chatModalLabel">Novo Chat</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <h5 class="modal-title">Que tipo de chat quer criar?</h5>
                    <div class="button-flex-container">
                        <button class="btn btn-primary btn-highlight" id="individualChatButton">Chat individual</button>
                        <button class="btn btn-success" id="groupChatButton">Chat de grupo</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
    document.body.appendChild(modalDiv);
    const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
    chatModal.show();

    chatModal._element.addEventListener('hidden.bs.modal', function () {
        chatModal.dispose();
        modalDiv.remove();
    });
})

